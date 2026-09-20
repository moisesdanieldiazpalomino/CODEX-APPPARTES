import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ClipboardList, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/status-badge";
import { getDb } from "@/db";
import { clients, locations, users, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { SLOT_LABELS, STATUS_LABELS, TYPE_LABELS, WORK_ORDER_STATUSES } from "@/lib/domain";

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; date?: string }> }) {
  const user = await requireUser();
  const { q = "", status = "", date = "" } = await searchParams;
  const rows = await getDb().select({ order: workOrders, client: clients, location: locations, technician: users }).from(workOrders)
    .innerJoin(clients, eq(workOrders.clientId, clients.id)).innerJoin(locations, eq(workOrders.locationId, locations.id))
    .leftJoin(users, eq(workOrders.assignedTechnicianId, users.id))
    .where(user.role === "TECHNICIAN" ? eq(workOrders.assignedTechnicianId, user.id) : undefined).orderBy(desc(workOrders.createdAt)).limit(300);
  const filtered = rows.filter(({ order, client, location, technician }) => {
    const matchText = !q || [order.number, order.reportedIssue, client.name, location.name, technician?.displayName ?? ""].some((value) => value.toLowerCase().includes(q.toLowerCase()));
    return matchText && (!status || order.status === status) && (!date || order.scheduledDate === date);
  });

  return (
    <main className="app-main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="page-title">{user.role === "OFFICE" ? "Trabajos" : "Mis trabajos"}</h1><p className="page-subtitle">Encuentra una visita por cliente, fecha o estado.</p></div>
        {user.role === "OFFICE" && <Button asChild size="lg" className="h-11 font-semibold"><Link href="/trabajos/nuevo"><Plus className="size-4" /> Nuevo trabajo</Link></Button>}
      </div>
      <form className="surface-panel mt-7 grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_165px_auto] xl:items-end xl:p-5">
        <div className="sm:col-span-2 xl:col-span-1"><label htmlFor="q" className="mb-1.5 block text-sm font-semibold">Buscar</label><Input id="q" name="q" defaultValue={q} placeholder="Número, cliente, local o técnico" className="h-11" /></div>
        <div><label htmlFor="status" className="mb-1.5 block text-sm font-semibold">Estado</label><NativeSelect id="status" name="status" defaultValue={status} className="h-11 w-full"><NativeSelectOption value="">Todos</NativeSelectOption>{WORK_ORDER_STATUSES.map((value) => <NativeSelectOption key={value} value={value}>{STATUS_LABELS[value]}</NativeSelectOption>)}</NativeSelect></div>
        <div><label htmlFor="date" className="mb-1.5 block text-sm font-semibold">Fecha</label><Input id="date" name="date" type="date" defaultValue={date} className="h-11" /></div>
        <Button type="submit" className="h-11 sm:col-span-2 xl:col-span-1"><Search className="size-4" /> Aplicar filtros</Button>
      </form>
      <section className="surface-panel mt-5 overflow-hidden">
        <div className="border-b border-[#e2eceb] px-5 py-4 text-sm font-semibold text-[#58717a]">{filtered.length} {filtered.length === 1 ? "trabajo" : "trabajos"}</div>
        {filtered.length ? (
          <div className="divide-y divide-[#e2eceb]">
            {filtered.map(({ order, client, location, technician }) => (
              <Link key={order.id} href={`/trabajos/${order.id}`} className="service-row grid gap-3 px-5 py-4 lg:grid-cols-[145px_minmax(0,1fr)_160px_170px] lg:items-center">
                <div><p className="font-display font-bold text-[#075f65]">{order.number}</p><p className="text-xs text-[#58717a]">{order.scheduledDate ?? "Sin fecha"}{order.timeSlot ? ` · ${SLOT_LABELS[order.timeSlot]}` : ""}</p></div>
                <div className="min-w-0"><p className="truncate font-semibold">{client.name} · {location.name}</p><p className="truncate text-sm text-[#58717a]">{TYPE_LABELS[order.type]} · {order.reportedIssue}</p></div>
                <p className="text-sm text-[#45636b]">{technician?.displayName ?? "Sin asignar"}</p>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center"><ClipboardList className="size-9 text-[#87adb1]" /><p className="mt-3 font-semibold">No encontramos trabajos</p><p className="mt-1 max-w-sm text-sm text-[#58717a]">Prueba con otro término, estado o fecha.</p></div>
        )}
      </section>
    </main>
  );
}
