import Link from "next/link";
import { eq } from "drizzle-orm";
import { Building2, Plus, Search } from "lucide-react";
import { createClientAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { clients, locations } from "@/db/schema";
import { requireOffice } from "@/lib/auth";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  await requireOffice();
  const { q = "", error } = await searchParams;
  const rows = await getDb().select().from(clients).where(eq(clients.active, true));
  const locationsRows = await getDb().select({ id: locations.id, clientId: locations.clientId }).from(locations).where(eq(locations.active, true));
  const visible = rows.filter((client) => [client.name, client.contactName, client.email, client.phone].some((value) => value.toLowerCase().includes(q.toLowerCase())));
  return <main className="app-main"><p className="eyebrow">Inventario</p><h1 className="page-title">Clientes y máquinas</h1><p className="page-subtitle">Organiza los clientes, sus locales y los equipos instalados.</p><div className="mt-5"><FormMessage error={error} /></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div><form className="mb-4 flex gap-2"><Input name="q" defaultValue={q} placeholder="Buscar cliente" className="h-11" /><Button type="submit" className="h-11"><Search /> Buscar</Button></form><div className="overflow-hidden rounded-2xl border border-[#d2e2e2] bg-white shadow-sm">{visible.length ? <div className="divide-y divide-[#e2eceb]">{visible.map((client) => <Link key={client.id} href={`/clientes/${client.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f1f8f7]"><span className="grid size-10 place-items-center rounded-xl bg-[#e6f4f3] text-[#087f86]"><Building2 className="size-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{client.name}</span><span className="block truncate text-sm text-slate-500">{client.contactName || client.phone || client.email || "Sin contacto"}</span></span><span className="text-sm text-slate-500">{locationsRows.filter((location) => location.clientId === client.id).length} locales</span></Link>)}</div> : <p className="px-5 py-10 text-center text-slate-500">No hay clientes todavía.</p>}</div></div>
      <Card className="h-fit gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Nuevo cliente</CardTitle></CardHeader><CardContent><form action={createClientAction} className="space-y-3"><div className="space-y-1"><Label htmlFor="name">Nombre</Label><Input id="name" name="name" required /></div><div className="space-y-1"><Label htmlFor="contactName">Persona de contacto</Label><Input id="contactName" name="contactName" /></div><div className="space-y-1"><Label htmlFor="phone">Teléfono</Label><Input id="phone" name="phone" type="tel" /></div><div className="space-y-1"><Label htmlFor="email">Correo</Label><Input id="email" name="email" type="email" /></div><div className="space-y-1"><Label htmlFor="notes">Observaciones</Label><Textarea id="notes" name="notes" /></div><Button type="submit" className="h-11 w-full bg-[#087f86] hover:bg-[#076970]"><Plus /> Añadir cliente</Button></form></CardContent></Card>
    </div>
  </main>;
}
