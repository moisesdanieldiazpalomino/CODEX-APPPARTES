import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeLegacyTimestamp } from "./migration-helpers.mjs";

const backup = resolve(process.argv[2] ?? "");
if (!backup || !existsSync(join(backup, "d1.sqlite"))) {
  throw new Error("Indica un respaldo que contenga d1.sqlite.");
}

const database = new DatabaseSync(join(backup, "d1.sqlite"), { readOnly: true });
const tables = [
  "users", "clients", "locations", "machines", "work_orders",
  "work_order_machines", "visits", "machine_proposals",
  "visit_machine_reports", "photos", "documents", "audit_logs",
];
const rows = Object.fromEntries(tables.map((name) => [name, database.prepare(`select * from "${name}"`).all()]));
database.close();

const objectDirectory = join(backup, "r2", "miniflare-R2BucketObject");
const objectDatabaseName = readdirSync(objectDirectory).find((name) => /^[a-f0-9]{64}\.sqlite$/.test(name));
if (!objectDatabaseName) throw new Error("No se encontró el índice de archivos R2.");
const objectDatabase = new DatabaseSync(join(objectDirectory, objectDatabaseName), { readOnly: true });
const objects = objectDatabase.prepare("select key, blob_id, size, http_metadata from _mf_objects").all().map((object) => {
  const path = join(backup, "r2", "site-creator-r2", "blobs", object.blob_id);
  if (!existsSync(path)) throw new Error(`Falta el archivo ${object.key}.`);
  const bytes = readFileSync(path);
  if (bytes.length !== object.size) throw new Error(`Tamaño incorrecto de ${object.key}.`);
  return {
    key: object.key,
    path,
    size: bytes.length,
    contentType: JSON.parse(object.http_metadata ?? "{}").contentType ?? "application/octet-stream",
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
});
objectDatabase.close();

const localOrders = new Map(rows.work_orders.map((row) => [row.id, row]));
const localVisits = new Map(rows.visits.map((row) => [row.id, row]));
const localMachines = new Map(rows.machines.map((row) => [row.id, row]));
const localProposals = new Map(rows.machine_proposals.map((row) => [row.id, row]));
const objectByKey = new Map(objects.map((object) => [object.key, object]));

for (const name of tables) {
  for (const row of rows[name]) {
    for (const [column, value] of Object.entries(row)) {
      if (column === "active") row[column] = Boolean(value);
      if (column === "created_at" || column === "updated_at" || column === "expires_at" ||
          column === "started_at" || column === "ended_at" || column === "signed_at" ||
          column === "reviewed_at") row[column] = normalizeLegacyTimestamp(value);
    }
  }
}

for (const visit of rows.visits) {
  const order = localOrders.get(visit.work_order_id);
  visit.scheduled_date = order?.scheduled_date ?? null;
  visit.time_slot = order?.time_slot ?? null;
}

for (const proposal of rows.machine_proposals) {
  const approvedReport = rows.visit_machine_reports.find((report) => report.proposal_id === proposal.id && report.machine_id);
  proposal.approved_machine_id = proposal.status === "APPROVED"
    ? approvedReport?.machine_id ?? proposal.existing_machine_id ?? null
    : null;
  if (proposal.status === "APPROVED" && !proposal.approved_machine_id) {
    throw new Error(`No se pudo resolver la máquina aprobada de la propuesta ${proposal.id}.`);
  }
}

for (const report of rows.visit_machine_reports) {
  const machine = report.machine_id ? localMachines.get(report.machine_id) : null;
  const proposal = report.proposal_id ? localProposals.get(report.proposal_id) : null;
  report.machine_label_snapshot = localVisits.get(report.visit_id)?.signed_at
    ? (machine ? `${machine.code} · ${machine.type} ${machine.brand} ${machine.model}` : proposal?.proposed_code ?? "Máquina provisional")
    : null;
  if (report.proposal_id) report.machine_id = null;
}

for (const document of rows.documents) {
  document.sha256 = objectByKey.get(document.object_key)?.sha256 ?? null;
  if (!document.sha256) throw new Error(`Falta el PDF ${document.object_key}.`);
}

for (const audit of rows.audit_logs) audit.details = JSON.parse(audit.details ?? "{}");

const referencedKeys = [
  ...rows.machines.map((row) => row.photo_object_key),
  ...rows.machine_proposals.map((row) => row.proposed_photo_object_key),
  ...rows.visits.map((row) => row.signature_object_key),
  ...rows.photos.map((row) => row.object_key),
  ...rows.documents.map((row) => row.object_key),
].filter(Boolean);
for (const key of referencedKeys) if (!objectByKey.has(key)) throw new Error(`Falta el objeto referenciado ${key}.`);

console.log(JSON.stringify({ rows, objects, counts: Object.fromEntries(tables.map((name) => [name, rows[name].length])) }));
