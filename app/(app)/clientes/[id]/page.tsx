import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Plus, Snowflake } from "lucide-react";
import { createLocationAction, createMachineAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { clients, locations, machines } from "@/db/schema";
import { requireOffice } from "@/lib/auth";

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireOffice();
  const { id } = await params;
  const { error } = await searchParams;
  const db = getDb();
  const client = (await db.select().from(clients).where(eq(clients.id, id)).limit(1))[0];
  if (!client) notFound();
  const locationRows = await db.select().from(locations).where(eq(locations.clientId, id));
  const machineRows = locationRows.length ? await db.select().from(machines).where(inArray(machines.locationId, locationRows.map((location) => location.id))) : [];
  return <main className="app-main"><Link href="/clientes" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#087f86]"><ArrowLeft className="size-4" /> Volver a clientes</Link><p className="eyebrow">Ficha de cliente</p><h1 className="page-title">{client.name}</h1><p className="page-subtitle">{client.contactName || "Sin contacto"} {client.phone ? `· ${client.phone}` : ""} {client.email ? `· ${client.email}` : ""}</p><div className="mt-5"><FormMessage error={error} /></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5">{locationRows.map((location) => <Card key={location.id} className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-[#087f86]" />{location.name}</CardTitle><p className="text-sm text-slate-500">{location.address}</p></CardHeader><CardContent className="space-y-2">{machineRows.filter((machine) => machine.locationId === location.id).map((machine) => <Link key={machine.id} href={`/maquinas/${machine.id}`} className="flex items-center gap-3 rounded-xl border border-[#d2e2e2] p-3 hover:bg-[#f1f8f7]"><Snowflake className="size-5 text-[#087f86]" /><span><span className="block font-semibold">{machine.code} · {machine.type}</span><span className="block text-sm text-slate-500">{machine.brand} {machine.model} · {machine.internalLocation}</span></span></Link>)}{!machineRows.some((machine) => machine.locationId === location.id) && <p className="text-sm text-slate-500">Sin máquinas registradas.</p>}</CardContent></Card>)}{!locationRows.length && <div className="rounded-2xl border border-[#d2e2e2] bg-white p-8 text-slate-500">Este cliente aún no tiene locales.</div>}</div>
      <div className="space-y-5"><Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Nuevo local</CardTitle></CardHeader><CardContent><form action={createLocationAction} className="space-y-3"><input type="hidden" name="clientId" value={id} /><div><Label htmlFor="locationName">Nombre del local</Label><Input id="locationName" name="name" required /></div><div><Label htmlFor="address">Dirección</Label><Input id="address" name="address" required /></div><div><Label htmlFor="locationContact">Contacto</Label><Input id="locationContact" name="contactName" /></div><div><Label htmlFor="locationPhone">Teléfono</Label><Input id="locationPhone" name="phone" /></div><div><Label htmlFor="accessNotes">Indicaciones de acceso</Label><Textarea id="accessNotes" name="accessNotes" /></div><Button type="submit" variant="outline" className="h-11 w-full"><Plus /> Añadir local</Button></form></CardContent></Card>
        {locationRows.length > 0 && <Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Nueva máquina</CardTitle></CardHeader><CardContent><form action={createMachineAction} className="space-y-3"><input type="hidden" name="clientId" value={id} /><div><Label htmlFor="locationId">Local</Label><NativeSelect id="locationId" name="locationId" className="w-full">{locationRows.map((location) => <NativeSelectOption key={location.id} value={location.id}>{location.name}</NativeSelectOption>)}</NativeSelect></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="code">Código</Label><Input id="code" name="code" required /></div><div><Label htmlFor="type">Tipo</Label><Input id="type" name="type" required /></div></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="brand">Marca</Label><Input id="brand" name="brand" /></div><div><Label htmlFor="model">Modelo</Label><Input id="model" name="model" /></div></div><div><Label htmlFor="serialNumber">Número de serie</Label><Input id="serialNumber" name="serialNumber" /></div><div><Label htmlFor="internalLocation">Ubicación dentro del local</Label><Input id="internalLocation" name="internalLocation" /></div><div><Label htmlFor="installationDate">Fecha de instalación</Label><Input id="installationDate" name="installationDate" type="date" /></div><div><Label htmlFor="photo">Foto</Label><Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="h-auto min-h-11 py-2" /></div><div><Label htmlFor="machineNotes">Observaciones</Label><Textarea id="machineNotes" name="notes" /></div><Button type="submit" className="h-11 w-full bg-[#087f86] hover:bg-[#076970]"><Plus /> Añadir máquina</Button></form></CardContent></Card>}
      </div>
    </div>
  </main>;
}
