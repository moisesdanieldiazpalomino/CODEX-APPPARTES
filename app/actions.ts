"use server";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  auditLogs,
  clients,
  documents,
  locations,
  machineProposals,
  machines,
  photos,
  users,
  visitMachineReports,
  visits,
  workOrderMachines,
  workOrders,
} from "@/db/schema";
import { authenticate, createSession, destroySession, requireOffice, requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { seedDemoData } from "@/lib/demo-seed";
import { canTransition, nextStatusForOutcome, TYPE_LABELS, validateVisitCompletion, visitScheduleError, type VisitOutcome } from "@/lib/domain";
import { optionalText, requiredText, selectedValues, textValue } from "@/lib/form";
import { createVisitPdf } from "@/lib/pdf";
import { storeFile, storeImage, storeSignature } from "@/lib/storage";

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function logAudit(actorId: string, entityType: string, entityId: string, action: string, details: Record<string, unknown> = {}) {
  await getDb().insert(auditLogs).values({ id: crypto.randomUUID(), actorId, entityType, entityId, action, details });
}

export async function loginAction(formData: FormData) {
  const username = textValue(formData, "username").toLowerCase();
  const password = textValue(formData, "password");
  const user = await authenticate(username, password);
  if (!user) errorRedirect("/login", "Usuario o contraseña incorrectos.");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function setupAction(formData: FormData) {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total > 0) redirect("/login");
  const displayName = requiredText(formData, "displayName", "El nombre");
  const username = requiredText(formData, "username", "El usuario").toLowerCase();
  const password = requiredText(formData, "password", "La contraseña");
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) errorRedirect("/setup", "El usuario debe tener entre 3 y 30 letras, números, puntos o guiones.");
  let passwordHash: string;
  try { passwordHash = await hashPassword(password); }
  catch (error) { errorRedirect("/setup", error instanceof Error ? error.message : "Contraseña no válida."); }
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, username, displayName, role: "OFFICE", passwordHash });
  if (formData.get("demo") === "on") await seedDemoData(id);
  await createSession(id);
  redirect("/dashboard");
}

export async function createUserAction(formData: FormData) {
  const actor = await requireOffice();
  const username = requiredText(formData, "username", "El usuario").toLowerCase();
  const displayName = requiredText(formData, "displayName", "El nombre");
  const password = requiredText(formData, "password", "La contraseña");
  const role = textValue(formData, "role") === "OFFICE" ? "OFFICE" : "TECHNICIAN";
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) errorRedirect("/usuarios", "El usuario no tiene un formato válido.");
  try {
    const id = crypto.randomUUID();
    await getDb().insert(users).values({ id, username, displayName, role, passwordHash: await hashPassword(password) });
    await logAudit(actor.id, "USER", id, "CREATED", { username, role });
  } catch (error) {
    errorRedirect("/usuarios", error instanceof Error && error.message.includes("UNIQUE") ? "Ese usuario ya existe." : "No se pudo crear el usuario.");
  }
  revalidatePath("/usuarios");
}

export async function toggleUserAction(formData: FormData) {
  const actor = await requireOffice();
  const id = requiredText(formData, "id", "El usuario");
  if (id === actor.id) errorRedirect("/usuarios", "No puedes desactivar tu propio acceso.");
  const active = textValue(formData, "active") === "true";
  await getDb().update(users).set({ active, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
  await logAudit(actor.id, "USER", id, active ? "ACTIVATED" : "DEACTIVATED");
  revalidatePath("/usuarios");
}

export async function resetPasswordAction(formData: FormData) {
  const actor = await requireOffice();
  const id = requiredText(formData, "id", "El usuario");
  const password = requiredText(formData, "password", "La contraseña");
  let passwordHash: string;
  try { passwordHash = await hashPassword(password); }
  catch (error) { errorRedirect("/usuarios", error instanceof Error ? error.message : "Contraseña no válida."); }
  await getDb().update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
  await logAudit(actor.id, "USER", id, "PASSWORD_RESET");
  revalidatePath("/usuarios");
}

export async function createClientAction(formData: FormData) {
  const actor = await requireOffice();
  const id = crypto.randomUUID();
  await getDb().insert(clients).values({
    id,
    name: requiredText(formData, "name", "El nombre del cliente"),
    contactName: textValue(formData, "contactName"),
    phone: textValue(formData, "phone"),
    email: textValue(formData, "email"),
    notes: textValue(formData, "notes"),
  });
  await logAudit(actor.id, "CLIENT", id, "CREATED");
  redirect(`/clientes/${id}`);
}

export async function createLocationAction(formData: FormData) {
  const actor = await requireOffice();
  const clientId = requiredText(formData, "clientId", "El cliente");
  const id = crypto.randomUUID();
  await getDb().insert(locations).values({
    id,
    clientId,
    name: requiredText(formData, "name", "El nombre del local"),
    address: requiredText(formData, "address", "La dirección"),
    contactName: textValue(formData, "contactName"),
    phone: textValue(formData, "phone"),
    accessNotes: textValue(formData, "accessNotes"),
  });
  await logAudit(actor.id, "LOCATION", id, "CREATED", { clientId });
  redirect(`/clientes/${clientId}`);
}

export async function createMachineAction(formData: FormData) {
  const actor = await requireOffice();
  const clientId = requiredText(formData, "clientId", "El cliente");
  const locationId = requiredText(formData, "locationId", "El local");
  const id = crypto.randomUUID();
  let photoObjectKey: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) photoObjectKey = await storeImage(photo, `machines/${id}`);
  try {
    await getDb().insert(machines).values({
      id, locationId, photoObjectKey,
      code: requiredText(formData, "code", "El código"),
      type: requiredText(formData, "type", "El tipo"),
      brand: textValue(formData, "brand"), model: textValue(formData, "model"),
      serialNumber: textValue(formData, "serialNumber"), internalLocation: textValue(formData, "internalLocation"),
      installationDate: optionalText(formData, "installationDate"), notes: textValue(formData, "notes"),
    });
  } catch {
    errorRedirect(`/clientes/${clientId}`, "Ya existe una máquina con ese código en el local.");
  }
  await logAudit(actor.id, "MACHINE", id, "CREATED", { locationId });
  redirect(`/maquinas/${id}`);
}

export async function createWorkOrderAction(formData: FormData) {
  const actor = await requireOffice();
  const id = crypto.randomUUID();
  const clientId = requiredText(formData, "clientId", "El cliente");
  const locationId = requiredText(formData, "locationId", "El local");
  const technicianId = optionalText(formData, "technicianId");
  const machineIds = selectedValues(formData, "machineIds");
  if (!machineIds.length) errorRedirect("/trabajos/nuevo", "Selecciona al menos una máquina.");
  const type = textValue(formData, "type") as "INSTALLATION" | "MAINTENANCE" | "BREAKDOWN";
  const scheduledDate = optionalText(formData, "scheduledDate");
  const timeSlot = optionalText(formData, "timeSlot") as "MORNING" | "AFTERNOON" | null;
  if (!["INSTALLATION", "MAINTENANCE", "BREAKDOWN"].includes(type)) errorRedirect("/trabajos/nuevo", "El tipo de trabajo no es válido.");
  const scheduleError = visitScheduleError(scheduledDate, timeSlot, Boolean(technicianId));
  if (scheduleError) errorRedirect("/trabajos/nuevo", scheduleError);
  const location = (await getDb().select().from(locations).where(eq(locations.id, locationId)).limit(1))[0];
  if (!location || location.clientId !== clientId) errorRedirect("/trabajos/nuevo", "El local no pertenece al cliente.");
  const selectedMachines = await getDb().select().from(machines).where(inArray(machines.id, machineIds));
  if (selectedMachines.length !== new Set(machineIds).size || selectedMachines.some((machine) => machine.locationId !== locationId)) errorRedirect("/trabajos/nuevo", "Las máquinas deben pertenecer al local seleccionado.");
  if (technicianId) {
    const technician = (await getDb().select().from(users).where(eq(users.id, technicianId)).limit(1))[0];
    if (!technician || !technician.active || technician.role !== "TECHNICIAN") errorRedirect("/trabajos/nuevo", "Selecciona un técnico activo.");
  }
  const status = technicianId ? "ASSIGNED" : "REGISTERED";
  await getDb().transaction(async (tx) => {
    const [numberRow] = await tx.execute(sql`select app_private.next_work_order_number() as number`);
    await tx.insert(workOrders).values({
      id, number: String(numberRow.number), clientId, locationId, type,
      reportedIssue: requiredText(formData, "reportedIssue", "La solicitud"),
      scheduledDate, timeSlot,
      assignedTechnicianId: technicianId, status, officeNotes: textValue(formData, "officeNotes"), createdById: actor.id,
    });
    for (const machineId of machineIds) await tx.insert(workOrderMachines).values({ workOrderId: id, machineId });
  });
  await logAudit(actor.id, "WORK_ORDER", id, "CREATED", { status, machineCount: machineIds.length });
  redirect(`/trabajos/${id}`);
}

export async function scheduleWorkOrderAction(formData: FormData) {
  const actor = await requireOffice();
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const technicianId = requiredText(formData, "technicianId", "El técnico");
  const scheduledDate = requiredText(formData, "scheduledDate", "La fecha");
  const timeSlot = requiredText(formData, "timeSlot", "La franja") as "MORNING" | "AFTERNOON";
  const order = (await getDb().select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0];
  const technician = (await getDb().select().from(users).where(eq(users.id, technicianId)).limit(1))[0];
  if (!order || !["REGISTERED", "PENDING_PART", "PENDING_RETURN", "ASSIGNED"].includes(order.status)) errorRedirect(`/trabajos/${workOrderId}`, "El trabajo no puede programarse ahora.");
  if (!technician || technician.role !== "TECHNICIAN" || !technician.active) errorRedirect(`/trabajos/${workOrderId}`, "Selecciona un técnico activo.");
  const scheduleError = visitScheduleError(scheduledDate, timeSlot, true);
  if (scheduleError) errorRedirect(`/trabajos/${workOrderId}`, scheduleError);
  await getDb().update(workOrders).set({ assignedTechnicianId: technicianId, scheduledDate, timeSlot, status: "ASSIGNED", updatedAt: new Date().toISOString() }).where(eq(workOrders.id, workOrderId));
  await logAudit(actor.id, "WORK_ORDER", workOrderId, "SCHEDULED", { technicianId, scheduledDate, timeSlot });
  redirect(`/trabajos/${workOrderId}?scheduled=1`);
}

export async function startVisitAction(formData: FormData) {
  const actor = await requireUser();
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const db = getDb();
  if (actor.role !== "TECHNICIAN") errorRedirect("/dashboard", "No puedes iniciar ese trabajo.");
  const visitId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(workOrders).where(eq(workOrders.id, workOrderId)).for("update").limit(1);
    if (!order || order.assignedTechnicianId !== actor.id) errorRedirect("/dashboard", "No puedes iniciar ese trabajo.");
    if (!canTransition(order.status, "IN_PROGRESS")) errorRedirect(`/trabajos/${workOrderId}`, "El trabajo no se puede iniciar en su estado actual.");
    if (!order.scheduledDate || !order.timeSlot) errorRedirect(`/trabajos/${workOrderId}`, "La oficina debe indicar fecha y franja antes de iniciar la visita.");
    const scheduleError = visitScheduleError(order.scheduledDate, order.timeSlot, true);
    if (scheduleError) errorRedirect(`/trabajos/${workOrderId}`, scheduleError);
    const existing = await tx.select({ total: count() }).from(visits).where(eq(visits.workOrderId, workOrderId));
    const links = await tx.select().from(workOrderMachines).where(eq(workOrderMachines.workOrderId, workOrderId));
    const pendingProposals = await tx.select().from(machineProposals).where(and(eq(machineProposals.workOrderId, workOrderId), eq(machineProposals.status, "PENDING")));
    await tx.insert(visits).values({
      id: visitId, workOrderId, sequence: existing[0].total + 1, technicianId: actor.id,
      scheduledDate: order.scheduledDate, timeSlot: order.timeSlot,
      startedAt: new Date().toISOString(), outcome: "DRAFT",
    });
    for (const link of links) await tx.insert(visitMachineReports).values({ id: crypto.randomUUID(), visitId, machineId: link.machineId });
    for (const proposal of pendingProposals) await tx.insert(visitMachineReports).values({ id: crypto.randomUUID(), visitId, proposalId: proposal.id });
    await tx.update(workOrders).set({ status: "IN_PROGRESS", updatedAt: new Date().toISOString() }).where(eq(workOrders.id, workOrderId));
  });
  await logAudit(actor.id, "VISIT", visitId, "STARTED", { workOrderId });
  redirect(`/trabajos/${workOrderId}/visitas/${visitId}`);
}

async function saveReportFields(formData: FormData, visitId: string, reportIds: string[]) {
  const db = getDb();
  if (!reportIds.length) return;
  const existing = await db.select().from(visitMachineReports).where(and(eq(visitMachineReports.visitId, visitId), inArray(visitMachineReports.id, reportIds)));
  for (const report of existing) {
    await db.update(visitMachineReports).set({
      problemFound: textValue(formData, `problem_${report.id}`),
      workPerformed: textValue(formData, `work_${report.id}`),
      actionsTaken: textValue(formData, `actions_${report.id}`),
      partsReplaced: textValue(formData, `parts_${report.id}`),
      observations: textValue(formData, `observations_${report.id}`),
      updatedAt: new Date().toISOString(),
    }).where(eq(visitMachineReports.id, report.id));
    for (const candidate of formData.getAll(`photos_${report.id}`)) {
      if (!(candidate instanceof File) || candidate.size === 0) continue;
      const photoId = crypto.randomUUID();
      const objectKey = await storeImage(candidate, `visits/${report.visitId}/${report.id}`);
      await db.insert(photos).values({ id: photoId, reportId: report.id, objectKey, fileName: candidate.name, contentType: candidate.type, size: candidate.size });
    }
  }
}

export async function saveVisitAction(formData: FormData) {
  const actor = await requireUser();
  const visitId = requiredText(formData, "visitId", "La visita");
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const visit = (await getDb().select().from(visits).where(eq(visits.id, visitId)).limit(1))[0];
  if (!visit || actor.role !== "TECHNICIAN" || visit.technicianId !== actor.id || visit.outcome !== "DRAFT") errorRedirect(`/trabajos/${workOrderId}`, "La visita ya no se puede editar.");
  await saveReportFields(formData, visitId, selectedValues(formData, "reportIds"));
  await getDb().update(visits).set({ generalNotes: textValue(formData, "generalNotes"), startedAt: requiredText(formData, "startedAt", "La hora inicial"), endedAt: optionalText(formData, "endedAt"), updatedAt: new Date().toISOString() }).where(eq(visits.id, visitId));
  revalidatePath(`/trabajos/${workOrderId}/visitas/${visitId}`);
  redirect(`/trabajos/${workOrderId}/visitas/${visitId}?saved=1`);
}

export async function completeVisitAction(formData: FormData) {
  const actor = await requireUser();
  const visitId = requiredText(formData, "visitId", "La visita");
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const db = getDb();
  const visit = (await db.select().from(visits).where(eq(visits.id, visitId)).limit(1))[0];
  if (!visit || actor.role !== "TECHNICIAN" || visit.technicianId !== actor.id || visit.outcome !== "DRAFT") errorRedirect(`/trabajos/${workOrderId}`, "La visita ya no se puede finalizar.");
  const reportIds = selectedValues(formData, "reportIds");
  await saveReportFields(formData, visitId, reportIds);
  const reports = await db.select({ report: visitMachineReports, machine: machines }).from(visitMachineReports).leftJoin(machines, eq(visitMachineReports.machineId, machines.id)).where(eq(visitMachineReports.visitId, visitId));
  const provisionalMachines = await db.select().from(machineProposals).where(eq(machineProposals.workOrderId, workOrderId));
  const startedAt = requiredText(formData, "startedAt", "La hora inicial");
  const endedAt = requiredText(formData, "endedAt", "La hora final");
  const signerName = textValue(formData, "signerName");
  const signatureDataUrl = textValue(formData, "signatureDataUrl");
  const errors = validateVisitCompletion({ startedAt, endedAt, signerName, signatureDataUrl, reports: reports.map(({ report }) => report) });
  if (errors.length) errorRedirect(`/trabajos/${workOrderId}/visitas/${visitId}`, errors[0]);
  const outcome = textValue(formData, "outcome") as VisitOutcome;
  if (!["PENDING_PART", "PENDING_RETURN", "COMPLETED"].includes(outcome)) errorRedirect(`/trabajos/${workOrderId}/visitas/${visitId}`, "Selecciona el resultado de la visita.");
  const signature = await storeSignature(signatureDataUrl, visitId);
  const context = (await db.select({ order: workOrders, client: clients, location: locations, technician: users }).from(workOrders).innerJoin(clients, eq(workOrders.clientId, clients.id)).innerJoin(locations, eq(workOrders.locationId, locations.id)).innerJoin(users, eq(workOrders.assignedTechnicianId, users.id)).where(eq(workOrders.id, workOrderId)).limit(1))[0];
  if (!context) errorRedirect(`/trabajos/${workOrderId}`, "No se encontró el trabajo.");
  const reportLabels = reports.map(({ report, machine }) => ({
    id: report.id,
    label: machine ? `${machine.code} · ${machine.type} ${machine.brand} ${machine.model}` : provisionalMachines.find((proposal) => proposal.id === report.proposalId)?.proposedCode ?? "Máquina provisional",
  }));
  const pdfBytes = await createVisitPdf({
    workOrderNumber: context.order.number, visitSequence: visit.sequence, typeLabel: TYPE_LABELS[context.order.type],
    clientName: context.client.name, locationName: context.location.name, address: context.location.address,
    technicianName: context.technician.displayName, startedAt: new Date(startedAt).toLocaleString("es-PE"), endedAt: new Date(endedAt).toLocaleString("es-PE"),
    outcomeLabel: outcome === "COMPLETED" ? "Terminado" : outcome === "PENDING_PART" ? "Pendiente de pieza" : "Pendiente de volver",
    signerName, generalNotes: textValue(formData, "generalNotes"),
    reports: reports.map(({ report }, index) => ({ machineLabel: reportLabels[index].label, problemFound: report.problemFound, workPerformed: report.workPerformed, actionsTaken: report.actionsTaken, partsReplaced: report.partsReplaced, observations: report.observations })),
  }, signature.bytes);
  const documentId = crypto.randomUUID();
  const fileName = `${context.order.number}-visita-${visit.sequence}.pdf`;
  const objectKey = `documents/${workOrderId}/${documentId}.pdf`;
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(pdfBytes).buffer);
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  await storeFile(objectKey, pdfBytes, "application/pdf");
  await db.transaction(async (tx) => {
    for (const report of reportLabels) await tx.update(visitMachineReports).set({ machineLabelSnapshot: report.label }).where(eq(visitMachineReports.id, report.id));
    await tx.update(visits).set({ endedAt, outcome, signerName, signatureObjectKey: signature.key, signedAt: new Date().toISOString(), generalNotes: textValue(formData, "generalNotes"), updatedAt: new Date().toISOString() }).where(eq(visits.id, visitId));
    await tx.update(workOrders).set({ status: nextStatusForOutcome(outcome), updatedAt: new Date().toISOString() }).where(eq(workOrders.id, workOrderId));
    await tx.insert(documents).values({ id: documentId, visitId, objectKey, fileName, size: pdfBytes.length, sha256 });
  });
  await logAudit(actor.id, "VISIT", visitId, "COMPLETED", { outcome, documentId });
  redirect(`/trabajos/${workOrderId}?completed=1`);
}

export async function createProposalAction(formData: FormData) {
  const actor = await requireUser();
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const order = (await getDb().select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0];
  if (!order || actor.role !== "TECHNICIAN" || order.assignedTechnicianId !== actor.id) errorRedirect("/dashboard", "No puedes proponer una máquina para ese trabajo.");
  const id = crypto.randomUUID();
  let photoObjectKey: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) photoObjectKey = await storeImage(photo, `proposals/${id}`);
  await getDb().insert(machineProposals).values({
    id, proposalType: "CREATE", locationId: order.locationId, workOrderId, proposedById: actor.id, proposedPhotoObjectKey: photoObjectKey,
    proposedCode: requiredText(formData, "code", "El código"), proposedType: requiredText(formData, "type", "El tipo"),
    proposedBrand: textValue(formData, "brand"), proposedModel: textValue(formData, "model"), proposedSerialNumber: textValue(formData, "serialNumber"),
    proposedInternalLocation: textValue(formData, "internalLocation"), proposedInstallationDate: optionalText(formData, "installationDate"), proposedNotes: textValue(formData, "notes"),
  });
  const draftVisit = (await getDb().select().from(visits).where(and(eq(visits.workOrderId, workOrderId), eq(visits.outcome, "DRAFT"))).limit(1))[0];
  if (draftVisit) await getDb().insert(visitMachineReports).values({ id: crypto.randomUUID(), visitId: draftVisit.id, proposalId: id });
  await logAudit(actor.id, "MACHINE_PROPOSAL", id, "CREATED", { workOrderId });
  redirect(`/trabajos/${workOrderId}?proposal=1`);
}

export async function reviewProposalAction(formData: FormData) {
  const actor = await requireOffice();
  const proposalId = requiredText(formData, "proposalId", "La propuesta");
  const decision = textValue(formData, "decision");
  const proposal = (await getDb().select().from(machineProposals).where(eq(machineProposals.id, proposalId)).limit(1))[0];
  if (!proposal || proposal.status !== "PENDING") errorRedirect("/propuestas", "La propuesta ya fue revisada.");
  if (decision === "APPROVED") {
    const machineId = proposal.existingMachineId ?? crypto.randomUUID();
    await getDb().transaction(async (tx) => {
      const machineValues = { locationId: proposal.locationId, code: proposal.proposedCode, type: proposal.proposedType, brand: proposal.proposedBrand, model: proposal.proposedModel, serialNumber: proposal.proposedSerialNumber, internalLocation: proposal.proposedInternalLocation, installationDate: proposal.proposedInstallationDate, notes: proposal.proposedNotes, photoObjectKey: proposal.proposedPhotoObjectKey };
      if (proposal.proposalType === "CREATE") await tx.insert(machines).values({ id: machineId, ...machineValues });
      else await tx.update(machines).set({ ...machineValues, updatedAt: new Date().toISOString() }).where(eq(machines.id, machineId));
      await tx.insert(workOrderMachines).values({ workOrderId: proposal.workOrderId, machineId }).onConflictDoNothing();
      await tx.update(machineProposals).set({ status: "APPROVED", approvedMachineId: machineId, reviewedById: actor.id, reviewedAt: new Date().toISOString(), reviewNotes: textValue(formData, "reviewNotes") }).where(eq(machineProposals.id, proposal.id));
    });
  } else {
    await getDb().update(machineProposals).set({ status: "REJECTED", reviewedById: actor.id, reviewedAt: new Date().toISOString(), reviewNotes: textValue(formData, "reviewNotes") }).where(eq(machineProposals.id, proposal.id));
  }
  await logAudit(actor.id, "MACHINE_PROPOSAL", proposalId, decision === "APPROVED" ? "APPROVED" : "REJECTED");
  revalidatePath("/propuestas");
}

export async function reopenWorkOrderAction(formData: FormData) {
  const actor = await requireOffice();
  const workOrderId = requiredText(formData, "workOrderId", "El trabajo");
  const reason = requiredText(formData, "reason", "El motivo");
  const order = (await getDb().select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1))[0];
  if (!order || order.status !== "COMPLETED" || !order.assignedTechnicianId) errorRedirect(`/trabajos/${workOrderId}`, "Ese trabajo no se puede reabrir.");
  await getDb().update(workOrders).set({ status: "ASSIGNED", reopenedReason: reason, updatedAt: new Date().toISOString() }).where(eq(workOrders.id, workOrderId));
  await logAudit(actor.id, "WORK_ORDER", workOrderId, "REOPENED", { reason });
  redirect(`/trabajos/${workOrderId}?reopened=1`);
}
