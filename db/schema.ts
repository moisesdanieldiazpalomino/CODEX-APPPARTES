import { sql } from "drizzle-orm";
import { bigint, boolean, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["OFFICE", "TECHNICIAN"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex("users_username_key").on(table.username)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: createdAt(),
}, (table) => [index("sessions_user_id_idx").on(table.userId), index("sessions_expires_at_idx").on(table.expiresAt)]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey(), name: text("name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  phone: text("phone").notNull().default(""), email: text("email").notNull().default(""),
  notes: text("notes").notNull().default(""), active: boolean("active").notNull().default(true),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("clients_name_idx").on(table.name)]);

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey(), clientId: uuid("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(), address: text("address").notNull(),
  contactName: text("contact_name").notNull().default(""), phone: text("phone").notNull().default(""),
  accessNotes: text("access_notes").notNull().default(""), active: boolean("active").notNull().default(true),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("locations_client_id_idx").on(table.clientId)]);

export const machines = pgTable("machines", {
  id: uuid("id").primaryKey(), locationId: uuid("location_id").notNull().references(() => locations.id),
  code: text("code").notNull(), type: text("type").notNull(),
  brand: text("brand").notNull().default(""), model: text("model").notNull().default(""),
  serialNumber: text("serial_number").notNull().default(""), internalLocation: text("internal_location").notNull().default(""),
  installationDate: date("installation_date", { mode: "string" }), photoObjectKey: text("photo_object_key"),
  notes: text("notes").notNull().default(""), active: boolean("active").notNull().default(true),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex("machines_location_id_code_key").on(table.locationId, table.code), index("machines_serial_number_idx").on(table.serialNumber)]);

export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey(), number: text("number").notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  type: text("type", { enum: ["INSTALLATION", "MAINTENANCE", "BREAKDOWN"] }).notNull(),
  reportedIssue: text("reported_issue").notNull(), scheduledDate: date("scheduled_date", { mode: "string" }),
  timeSlot: text("time_slot", { enum: ["MORNING", "AFTERNOON"] }),
  assignedTechnicianId: uuid("assigned_technician_id").references(() => users.id),
  status: text("status", { enum: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "PENDING_PART", "PENDING_RETURN", "COMPLETED"] }).notNull().default("REGISTERED"),
  officeNotes: text("office_notes").notNull().default(""), reopenedReason: text("reopened_reason"),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("work_orders_number_key").on(table.number),
  index("work_orders_technician_status_idx").on(table.assignedTechnicianId, table.status),
  index("work_orders_date_status_idx").on(table.scheduledDate, table.status),
  index("work_orders_client_created_idx").on(table.clientId, table.createdAt),
  index("work_orders_location_id_idx").on(table.locationId),
]);

export const workOrderCounters = pgTable("work_order_counters", {
  year: integer("year").primaryKey(), lastValue: integer("last_value").notNull(), updatedAt: updatedAt(),
});

export const workOrderMachines = pgTable("work_order_machines", {
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
  machineId: uuid("machine_id").notNull().references(() => machines.id),
}, (table) => [primaryKey({ columns: [table.workOrderId, table.machineId] }), index("work_order_machines_machine_id_idx").on(table.machineId)]);

export const visits = pgTable("visits", {
  id: uuid("id").primaryKey(), workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
  sequence: integer("sequence").notNull(), technicianId: uuid("technician_id").notNull().references(() => users.id),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(), timeSlot: text("time_slot", { enum: ["MORNING", "AFTERNOON"] }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
  endedAt: timestamp("ended_at", { withTimezone: true, mode: "string" }),
  outcome: text("outcome", { enum: ["SCHEDULED", "DRAFT", "PENDING_PART", "PENDING_RETURN", "COMPLETED"] }).notNull().default("SCHEDULED"),
  generalNotes: text("general_notes").notNull().default(""), signerName: text("signer_name"),
  signatureObjectKey: text("signature_object_key"),
  signedAt: timestamp("signed_at", { withTimezone: true, mode: "string" }),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex("visits_work_order_id_sequence_key").on(table.workOrderId, table.sequence), index("visits_work_order_id_idx").on(table.workOrderId), index("visits_technician_date_idx").on(table.technicianId, table.scheduledDate)]);

export const machineProposals = pgTable("machine_proposals", {
  id: uuid("id").primaryKey(), proposalType: text("proposal_type", { enum: ["CREATE", "UPDATE"] }).notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("PENDING"),
  locationId: uuid("location_id").notNull().references(() => locations.id),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
  existingMachineId: uuid("existing_machine_id").references(() => machines.id),
  approvedMachineId: uuid("approved_machine_id").references(() => machines.id),
  proposedCode: text("proposed_code").notNull(), proposedType: text("proposed_type").notNull(),
  proposedBrand: text("proposed_brand").notNull().default(""), proposedModel: text("proposed_model").notNull().default(""),
  proposedSerialNumber: text("proposed_serial_number").notNull().default(""),
  proposedInternalLocation: text("proposed_internal_location").notNull().default(""),
  proposedInstallationDate: date("proposed_installation_date", { mode: "string" }),
  proposedNotes: text("proposed_notes").notNull().default(""), proposedPhotoObjectKey: text("proposed_photo_object_key"),
  proposedById: uuid("proposed_by_id").notNull().references(() => users.id),
  reviewedById: uuid("reviewed_by_id").references(() => users.id), reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }), createdAt: createdAt(),
}, (table) => [index("machine_proposals_order_id_idx").on(table.workOrderId), index("machine_proposals_approved_machine_id_idx").on(table.approvedMachineId)]);

export const visitMachineReports = pgTable("visit_machine_reports", {
  id: uuid("id").primaryKey(), visitId: uuid("visit_id").notNull().references(() => visits.id),
  machineId: uuid("machine_id").references(() => machines.id), proposalId: uuid("proposal_id").references(() => machineProposals.id),
  machineLabelSnapshot: text("machine_label_snapshot"),
  problemFound: text("problem_found").notNull().default(""), workPerformed: text("work_performed").notNull().default(""),
  actionsTaken: text("actions_taken").notNull().default(""), partsReplaced: text("parts_replaced").notNull().default(""),
  observations: text("observations").notNull().default(""), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("visit_machine_reports_visit_id_idx").on(table.visitId), index("visit_machine_reports_machine_visit_idx").on(table.machineId, table.visitId), index("visit_machine_reports_proposal_id_idx").on(table.proposalId)]);

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey(), reportId: uuid("report_id").notNull().references(() => visitMachineReports.id),
  objectKey: text("object_key").notNull(), fileName: text("file_name").notNull(), contentType: text("content_type").notNull(),
  size: bigint("size", { mode: "number" }).notNull(), createdAt: createdAt(),
}, (table) => [index("photos_report_id_idx").on(table.reportId), uniqueIndex("photos_object_key_key").on(table.objectKey)]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey(), visitId: uuid("visit_id").notNull().references(() => visits.id),
  version: integer("version").notNull().default(1), objectKey: text("object_key").notNull(),
  fileName: text("file_name").notNull(), contentType: text("content_type").notNull().default("application/pdf"),
  size: bigint("size", { mode: "number" }).notNull(), sha256: text("sha256"), createdAt: createdAt(),
}, (table) => [uniqueIndex("documents_visit_id_version_key").on(table.visitId, table.version), uniqueIndex("documents_object_key_key").on(table.objectKey)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey(), actorId: uuid("actor_id").notNull().references(() => users.id),
  entityType: text("entity_type").notNull(), entityId: uuid("entity_id").notNull(), action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: createdAt(),
}, (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt), index("audit_logs_created_at_idx").on(table.createdAt)]);
