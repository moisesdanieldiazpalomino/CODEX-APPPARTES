import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, machines, photos, visitMachineReports, visits, workOrders, workOrderMachines } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getStoredFile } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Acceso no autorizado", { status: 401 });
  const { kind, id } = await params;
  const db = getDb();
  let key: string | null = null;
  let contentType = "application/octet-stream";
  let fileName = "archivo";
  let assignedTechnicianId: string | null = null;
  if (kind === "documento") {
    const row = (await db.select({ document: documents, order: workOrders }).from(documents).innerJoin(visits, eq(documents.visitId, visits.id)).innerJoin(workOrders, eq(visits.workOrderId, workOrders.id)).where(eq(documents.id, id)).limit(1))[0];
    if (!row) return new Response("Archivo no encontrado", { status: 404 });
    key = row.document.objectKey; contentType = "application/pdf"; fileName = row.document.fileName; assignedTechnicianId = row.order.assignedTechnicianId;
  } else if (kind === "foto") {
    const row = (await db.select({ photo: photos, order: workOrders }).from(photos).innerJoin(visitMachineReports, eq(photos.reportId, visitMachineReports.id)).innerJoin(visits, eq(visitMachineReports.visitId, visits.id)).innerJoin(workOrders, eq(visits.workOrderId, workOrders.id)).where(eq(photos.id, id)).limit(1))[0];
    if (!row) return new Response("Archivo no encontrado", { status: 404 });
    key = row.photo.objectKey; contentType = row.photo.contentType; fileName = row.photo.fileName; assignedTechnicianId = row.order.assignedTechnicianId;
  } else if (kind === "maquina") {
    const machine = (await db.select().from(machines).where(eq(machines.id, id)).limit(1))[0];
    if (!machine?.photoObjectKey) return new Response("Archivo no encontrado", { status: 404 });
    const links = await db.select({ order: workOrders }).from(workOrderMachines).innerJoin(workOrders, eq(workOrderMachines.workOrderId, workOrders.id)).where(eq(workOrderMachines.machineId, id));
    if (user.role === "TECHNICIAN" && !links.some(({ order }) => order.assignedTechnicianId === user.id)) return new Response("Acceso denegado", { status: 403 });
    key = machine.photoObjectKey; contentType = key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg"; fileName = `${machine.code}.${key.split(".").pop()}`;
  } else return new Response("Archivo no encontrado", { status: 404 });
  if (user.role === "TECHNICIAN" && kind !== "maquina" && assignedTechnicianId !== user.id) return new Response("Acceso denegado", { status: 403 });
  const object = await getStoredFile(key);
  if (!object) return new Response("Archivo no encontrado", { status: 404 });
  return new Response(object, { headers: { "Content-Type": contentType, "Content-Disposition": `${contentType === "application/pdf" ? "attachment" : "inline"}; filename="${fileName.replace(/["\r\n]/g, "")}"`, "Cache-Control": "private, no-store" } });
}
