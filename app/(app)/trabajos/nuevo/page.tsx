import Link from "next/link";
import { eq } from "drizzle-orm";
import { FormMessage } from "@/components/form-message";
import { WorkOrderForm } from "@/components/work-order-form";
import { getDb } from "@/db";
import { clients, locations, machines, users } from "@/db/schema";
import { requireOffice } from "@/lib/auth";

export default async function NewWorkOrderPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireOffice();
  const db = getDb();
  const [clientRows, locationRows, machineRows, technicianRows] = await Promise.all([
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.active, true)),
    db.select({ id: locations.id, clientId: locations.clientId, name: locations.name, address: locations.address }).from(locations).where(eq(locations.active, true)),
    db.select({ id: machines.id, locationId: machines.locationId, code: machines.code, type: machines.type, brand: machines.brand }).from(machines).where(eq(machines.active, true)),
    db.select({ id: users.id, displayName: users.displayName }).from(users).where(eq(users.role, "TECHNICIAN")),
  ]);
  const { error } = await searchParams;
  return <main className="app-main"><p className="eyebrow">Trabajos</p><h1 className="page-title">Nuevo trabajo</h1><p className="page-subtitle">Registra la solicitud y asigna una visita.</p><div className="mt-4"><FormMessage error={error} /></div>{clientRows.length ? <div className="mt-6"><WorkOrderForm clients={clientRows} locations={locationRows} machines={machineRows} technicians={technicianRows} /></div> : <div className="mt-6 rounded-2xl border border-[#d2e2e2] bg-white p-8"><p className="font-semibold">Primero añade un cliente y un local.</p><Link href="/clientes" className="mt-3 inline-block font-semibold text-[#087f86]">Ir a clientes</Link></div>}</main>;
}
