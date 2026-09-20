import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, CalendarDays, CheckCircle2, ClipboardList, Clock3, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { getDb } from "@/db";
import { clients, locations, users, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { SLOT_LABELS, TYPE_LABELS } from "@/lib/domain";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = getDb();
  const filter = user.role === "TECHNICIAN" ? eq(workOrders.assignedTechnicianId, user.id) : undefined;
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const dateLabel = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(now);
  const rows = await db.select({ order: workOrders, client: clients, location: locations, technician: users })
    .from(workOrders).innerJoin(clients, eq(workOrders.clientId, clients.id)).innerJoin(locations, eq(workOrders.locationId, locations.id))
    .leftJoin(users, eq(workOrders.assignedTechnicianId, users.id))
    .where(filter).orderBy(desc(workOrders.scheduledDate), desc(workOrders.createdAt)).limit(50);
  const active = rows.filter(({ order }) => order.status !== "COMPLETED");
  const todayRows = active.filter(({ order }) => order.scheduledDate === today);
  const heroRows = todayRows.slice(0, 3);
  const displayed = [...todayRows.slice(3), ...active.filter(({ order }) => order.scheduledDate !== today)].slice(0, 8);
  const inProgress = active.filter(({ order }) => order.status === "IN_PROGRESS").length;
  const pending = active.filter(({ order }) => order.status === "PENDING_PART" || order.status === "PENDING_RETURN").length;
  const completed = rows.filter(({ order }) => order.status === "COMPLETED").length;

  return (
    <main className="app-main">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{user.role === "OFFICE" ? "Centro de servicio" : "Mis trabajos"}</h1>
          <p className="page-subtitle">{user.role === "OFFICE" ? "Organiza las visitas y sigue los partes del equipo." : "Consulta tus visitas y completa los partes asignados."}</p>
        </div>
        {user.role === "OFFICE" && <Button asChild size="lg" className="h-11 font-semibold"><Link href="/trabajos/nuevo"><Plus className="size-4" /> Nuevo trabajo</Link></Button>}
      </div>

      <section className="vent-pattern relative mt-7 overflow-hidden rounded-[1.15rem] bg-[#12333d] text-white">
        <div className="relative z-10 p-5 sm:p-7 lg:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium capitalize text-[#a9d3d2]"><CalendarDays className="size-4" /> {dateLabel}</p>
              <h2 className="font-display mt-3 text-[clamp(1.75rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.04em]">Agenda de hoy</h2>
              <p className="mt-1 text-[#c7dedf]">{todayRows.length === 0 ? "No hay visitas programadas para hoy." : todayRows.length === 1 ? "Hay una visita programada para hoy." : `Hay ${todayRows.length} visitas programadas para hoy.`}</p>
            </div>
            <div className="font-display rounded-xl border border-white/20 bg-white/10 px-5 py-2 text-4xl font-bold tabular-nums" aria-label={`${todayRows.length} visitas para hoy`}>{todayRows.length.toString().padStart(2, "0")}</div>
          </div>
          {heroRows.length > 0 ? (
            <div className="mt-7 grid gap-2.5">
              {heroRows.map(({ order, client, location }) => (
                <Link key={order.id} href={`/trabajos/${order.id}`} className="group grid gap-2 rounded-xl border border-white/15 bg-white/[0.09] p-4 transition-colors hover:bg-white/[0.16] sm:grid-cols-[115px_minmax(0,1fr)_auto] sm:items-center">
                  <span className="font-display font-semibold text-[#9de0dc]">{order.timeSlot ? SLOT_LABELS[order.timeSlot] : "Sin franja"}</span>
                  <span className="min-w-0"><span className="block truncate font-semibold">{client.name}</span><span className="block truncate text-sm text-[#c7dedf]">{location.name} · {TYPE_LABELS[order.type]} · {order.number}</span></span>
                  <ArrowUpRight className="hidden size-5 text-[#9de0dc] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
                </Link>
              ))}
              {todayRows.length > heroRows.length && <Link href="/trabajos" className="mt-1 w-fit text-sm font-semibold text-[#9de0dc] underline underline-offset-4">Ver las demás visitas de hoy</Link>}
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-5 text-sm text-[#d9ebea]">{user.role === "OFFICE" ? "Puedes crear un trabajo nuevo o revisar los que siguen abiertos." : "La oficina te avisará cuando programe una visita."}</div>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-3 divide-x divide-[#d2e2e2] rounded-xl border border-[#d2e2e2] bg-white py-4">
        <div className="flex flex-col gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><Wrench className="size-4 shrink-0 text-[#087f86]" /><span className="font-display text-xl font-bold tabular-nums sm:text-2xl">{inProgress}</span><span className="text-xs text-[#58717a] sm:text-sm">En curso</span></div>
        <div className="flex flex-col gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><Clock3 className="size-4 shrink-0 text-[#b96620]" /><span className="font-display text-xl font-bold tabular-nums sm:text-2xl">{pending}</span><span className="text-xs text-[#58717a] sm:text-sm">Pendientes</span></div>
        <div className="flex flex-col gap-1 px-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"><CheckCircle2 className="size-4 shrink-0 text-[#087f86]" /><span className="font-display text-xl font-bold tabular-nums sm:text-2xl">{completed}</span><span className="text-xs text-[#58717a] sm:text-sm">Terminados</span></div>
      </div>

      <section className="surface-panel mt-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2eceb] px-5 py-5 sm:px-7">
          <div><h2 className="font-display text-xl font-bold tracking-[-0.025em]">Próximos y pendientes</h2><p className="mt-0.5 text-sm text-[#58717a]">{displayed.length} trabajos visibles</p></div>
          <Button variant="outline" asChild className="h-10 border-[#c8dada]"><Link href="/trabajos">Ver todos</Link></Button>
        </div>
        {displayed.length ? (
          <div className="divide-y divide-[#e2eceb]">
            {displayed.map(({ order, client, location, technician }) => (
              <Link key={order.id} href={`/trabajos/${order.id}`} className="service-row grid gap-3 px-5 py-4 sm:grid-cols-[130px_minmax(0,1fr)_130px_160px] sm:items-center sm:px-7">
                <div><p className="font-display font-bold text-[#075f65]">{order.number}</p><p className="text-xs text-[#58717a]">{order.scheduledDate ?? "Sin fecha"} {order.timeSlot ? SLOT_LABELS[order.timeSlot] : ""}</p></div>
                <div className="min-w-0"><p className="truncate font-semibold">{client.name}</p><p className="truncate text-sm text-[#58717a]">{location.name} · {TYPE_LABELS[order.type]}</p></div>
                <p className="text-sm text-[#45636b]">{technician?.displayName ?? "Sin asignar"}</p>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center"><ClipboardList className="size-9 text-[#87adb1]" /><p className="mt-3 font-semibold">No hay más trabajos abiertos</p><p className="mt-1 max-w-sm text-sm text-[#58717a]">{user.role === "OFFICE" ? "Cuando registres o asignes un trabajo, aparecerá aquí." : "Todos tus trabajos asignados están en la agenda de hoy."}</p></div>
        )}
      </section>
    </main>
  );
}
