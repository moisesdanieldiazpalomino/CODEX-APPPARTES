"use client";

import { useState } from "react";
import { createWorkOrderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type FormDataLists = {
  clients: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; clientId: string; name: string; address: string }>;
  machines: Array<{ id: string; locationId: string; code: string; type: string; brand: string }>;
  technicians: Array<{ id: string; displayName: string }>;
};

export function WorkOrderForm({ clients, locations, machines, technicians }: FormDataLists) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const visibleLocations = locations.filter((location) => location.clientId === clientId);
  const [locationId, setLocationId] = useState(visibleLocations[0]?.id ?? "");
  const selectedLocationId = visibleLocations.some((location) => location.id === locationId) ? locationId : visibleLocations[0]?.id ?? "";
  const visibleMachines = machines.filter((machine) => machine.locationId === selectedLocationId);
  return <form action={createWorkOrderAction} className="space-y-5"><Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Solicitud y destino</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="clientId">Cliente</Label><NativeSelect id="clientId" name="clientId" value={clientId} onChange={(event) => { const id = event.target.value; setClientId(id); setLocationId(locations.find((location) => location.clientId === id)?.id ?? ""); }} className="h-11 w-full" required>{clients.map((client) => <NativeSelectOption key={client.id} value={client.id}>{client.name}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="locationId">Local</Label><NativeSelect id="locationId" name="locationId" value={selectedLocationId} onChange={(event) => setLocationId(event.target.value)} className="h-11 w-full" required>{visibleLocations.map((location) => <NativeSelectOption key={location.id} value={location.id}>{location.name} · {location.address}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="type">Tipo de trabajo</Label><NativeSelect id="type" name="type" className="h-11 w-full"><NativeSelectOption value="BREAKDOWN">Avería</NativeSelectOption><NativeSelectOption value="MAINTENANCE">Mantenimiento</NativeSelectOption><NativeSelectOption value="INSTALLATION">Instalación</NativeSelectOption></NativeSelect></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="reportedIssue">Solicitud o problema comunicado</Label><Textarea id="reportedIssue" name="reportedIssue" required placeholder="Describe lo que ha comunicado el cliente" className="min-h-28" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="officeNotes">Indicaciones de oficina</Label><Textarea id="officeNotes" name="officeNotes" placeholder="Acceso, contacto u otras indicaciones" /></div></CardContent></Card>
    <Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Máquinas incluidas</CardTitle></CardHeader><CardContent>{visibleMachines.length ? <div className="grid gap-3 sm:grid-cols-2">{visibleMachines.map((machine) => <label key={machine.id} className="flex items-center gap-3 rounded-xl border border-[#d2e2e2] p-3"><Checkbox name="machineIds" value={machine.id} /><span><span className="block font-semibold">{machine.code}</span><span className="text-sm text-slate-500">{machine.type} {machine.brand}</span></span></label>)}</div> : <p className="text-sm text-slate-500">No hay máquinas en este local. Da de alta una en la ficha del cliente.</p>}</CardContent></Card>
    <Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Asignación</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="technicianId">Técnico</Label><NativeSelect id="technicianId" name="technicianId" className="h-11 w-full"><NativeSelectOption value="">Sin asignar</NativeSelectOption>{technicians.map((technician) => <NativeSelectOption key={technician.id} value={technician.id}>{technician.displayName}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="scheduledDate">Fecha de visita</Label><Input id="scheduledDate" name="scheduledDate" type="date" className="h-11" /></div><div className="space-y-2"><Label htmlFor="timeSlot">Franja</Label><NativeSelect id="timeSlot" name="timeSlot" className="h-11 w-full"><NativeSelectOption value="">Sin franja</NativeSelectOption><NativeSelectOption value="MORNING">Mañana</NativeSelectOption><NativeSelectOption value="AFTERNOON">Tarde</NativeSelectOption></NativeSelect></div></CardContent></Card><Button type="submit" size="lg" className="h-11 bg-[#087f86] hover:bg-[#076970]">Guardar trabajo</Button></form>;
}
