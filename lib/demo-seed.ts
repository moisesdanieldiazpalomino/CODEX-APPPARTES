import { getDb } from "@/db";
import { clients, locations, machines, users, workOrderMachines, workOrders } from "@/db/schema";
import { hashPassword } from "@/lib/crypto";

export async function seedDemoData(officeUserId: string) {
  const db = getDb();
  const technicianPassword = await hashPassword("Tecnico2026!");
  const technicians = [
    { id: crypto.randomUUID(), username: "tecnico1", displayName: "Carlos Vega" },
    { id: crypto.randomUUID(), username: "tecnico2", displayName: "Diego Rojas" },
    { id: crypto.randomUUID(), username: "tecnico3", displayName: "Luis Paredes" },
  ];
  const clientId = crypto.randomUUID();
  const locationId = crypto.randomUUID();
  const secondClientId = crypto.randomUUID();
  const secondLocationId = crypto.randomUUID();
  const machineIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  const orderId = crypto.randomUUID();
  const secondOrderId = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    await tx.insert(users).values(technicians.map((technician) => ({ ...technician, role: "TECHNICIAN" as const, passwordHash: technicianPassword })));
    await tx.insert(clients).values({ id: clientId, name: "Hotel Miraflores", contactName: "Ana Morales", phone: "+51 999 444 220", email: "mantenimiento@hotelmiraflores.test" });
    await tx.insert(locations).values({ id: locationId, clientId, name: "Sede principal", address: "Av. José Larco 1234, Miraflores", contactName: "Ana Morales", phone: "+51 999 444 220", accessNotes: "Ingresar por recepción y solicitar llave de azotea." });
    await tx.insert(machines).values({ id: machineIds[0], locationId, code: "CH-001", type: "Chiller", brand: "Carrier", model: "30XA", serialNumber: "CR-30XA-8821", internalLocation: "Azotea", installationDate: "2022-04-15", notes: "Equipo principal del edificio." });
    await tx.insert(machines).values({ id: machineIds[1], locationId, code: "SP-201", type: "Split pared", brand: "Daikin", model: "FTKC35", serialNumber: "DK-FT-3290", internalLocation: "Habitación 201", installationDate: "2023-01-10" });
    await tx.insert(clients).values({ id: secondClientId, name: "Clínica San Felipe", contactName: "Jorge Salas", phone: "+51 988 320 111", email: "servicios@clinicasanfelipe.test" });
    await tx.insert(locations).values({ id: secondLocationId, clientId: secondClientId, name: "Consultorios", address: "Av. Gregorio Escobedo 650, Jesús María", contactName: "Jorge Salas", phone: "+51 988 320 111" });
    await tx.insert(machines).values({ id: machineIds[2], locationId: secondLocationId, code: "VRF-01", type: "Sistema VRF", brand: "LG", model: "Multi V 5", serialNumber: "LG-MV5-44021", internalLocation: "Cuarto técnico", installationDate: "2021-08-20" });
    await tx.insert(workOrders).values({ id: orderId, number: "OT-2026-0001", clientId, locationId, type: "BREAKDOWN", reportedIssue: "El chiller principal no alcanza la temperatura programada y muestra alarma intermitente.", scheduledDate: today, timeSlot: "MORNING", assignedTechnicianId: technicians[0].id, status: "ASSIGNED", createdById: officeUserId });
    await tx.insert(workOrderMachines).values({ workOrderId: orderId, machineId: machineIds[0] });
    await tx.insert(workOrders).values({ id: secondOrderId, number: "OT-2026-0002", clientId: secondClientId, locationId: secondLocationId, type: "MAINTENANCE", reportedIssue: "Mantenimiento preventivo trimestral del sistema VRF.", scheduledDate: today, timeSlot: "AFTERNOON", assignedTechnicianId: technicians[1].id, status: "ASSIGNED", createdById: officeUserId });
    await tx.insert(workOrderMachines).values({ workOrderId: secondOrderId, machineId: machineIds[2] });
  });
}
