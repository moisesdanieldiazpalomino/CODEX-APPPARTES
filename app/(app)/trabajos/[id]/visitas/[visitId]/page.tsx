import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { completeVisitAction, saveVisitAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { machines, photos, visitMachineReports, visits, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

function dateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export default async function VisitPage({ params, searchParams }: { params: Promise<{ id: string; visitId: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await requireUser();
  const { id, visitId } = await params;
  const { error, saved } = await searchParams;
  const db = getDb();
  const visit = (await db.select().from(visits).where(eq(visits.id, visitId)).limit(1))[0];
  const order = (await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1))[0];
  if (!visit || !order || visit.workOrderId !== id) notFound();
  if (user.role !== "TECHNICIAN" || visit.technicianId !== user.id || order.assignedTechnicianId !== user.id) redirect("/dashboard");
  if (visit.outcome !== "DRAFT") redirect(`/trabajos/${id}`);
  const reports = await db.select({ report: visitMachineReports, machine: machines }).from(visitMachineReports).leftJoin(machines, eq(visitMachineReports.machineId, machines.id)).where(eq(visitMachineReports.visitId, visitId));
  const imageRows = await db.select({ photo: photos }).from(photos).where(eq(photos.reportId, reports[0]?.report.id ?? ""));
  return <main className="app-main"><Link href={`/trabajos/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#087f86]"><ArrowLeft className="size-4" /> Volver al trabajo</Link><p className="eyebrow">{order.number} · Visita {visit.sequence}</p><h1 className="page-title">Parte de trabajo</h1><p className="page-subtitle">Guarda un borrador mientras avanzas y firma al finalizar.</p><div className="mt-5"><FormMessage error={error} success={saved ? "Borrador guardado." : undefined} /></div>
    <form className="mt-6 space-y-5" encType="multipart/form-data"><input type="hidden" name="visitId" value={visitId} /><input type="hidden" name="workOrderId" value={id} />
      <Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Horario de la visita</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="startedAt">Inicio</Label><Input id="startedAt" name="startedAt" type="datetime-local" defaultValue={dateTimeLocal(visit.startedAt)} className="h-11" required /></div><div className="space-y-2"><Label htmlFor="endedAt">Finalización</Label><Input id="endedAt" name="endedAt" type="datetime-local" defaultValue={dateTimeLocal(visit.endedAt)} className="h-11" /></div></CardContent></Card>
      {reports.map(({ report, machine }, index) => <Card key={report.id} className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>{index + 1}. {machine?.code ?? "Máquina provisional"} · {machine?.type ?? "Equipo"}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="reportIds" value={report.id} /><div className="space-y-2 sm:col-span-2"><Label htmlFor={`problem_${report.id}`}>Problema encontrado</Label><Textarea id={`problem_${report.id}`} name={`problem_${report.id}`} defaultValue={report.problemFound} placeholder="Qué encontraste en el equipo" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor={`work_${report.id}`}>Trabajo realizado</Label><Textarea id={`work_${report.id}`} name={`work_${report.id}`} defaultValue={report.workPerformed} placeholder="Qué se hizo" /></div><div className="space-y-2"><Label htmlFor={`actions_${report.id}`}>Acciones realizadas</Label><Textarea id={`actions_${report.id}`} name={`actions_${report.id}`} defaultValue={report.actionsTaken} /></div><div className="space-y-2"><Label htmlFor={`parts_${report.id}`}>Piezas reemplazadas</Label><Textarea id={`parts_${report.id}`} name={`parts_${report.id}`} defaultValue={report.partsReplaced} placeholder="Texto libre; no mueve almacén" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor={`observations_${report.id}`}>Observaciones</Label><Textarea id={`observations_${report.id}`} name={`observations_${report.id}`} defaultValue={report.observations} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor={`photos_${report.id}`}>Fotos</Label><Input id={`photos_${report.id}`} name={`photos_${report.id}`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="h-auto min-h-11 py-2" /><p className="text-xs text-slate-500">JPG, PNG o WebP · máximo 8 MB por imagen</p>{imageRows.filter(({ photo }) => photo.reportId === report.id).map(({ photo }) => <a key={photo.id} href={`/archivos/foto/${photo.id}`} target="_blank" className="mr-3 inline-flex items-center gap-1 text-sm text-[#087f86]"><Camera className="size-4" />{photo.fileName}</a>)}</div></CardContent></Card>)}
      <Card className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>Cierre</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="generalNotes">Observaciones generales</Label><Textarea id="generalNotes" name="generalNotes" defaultValue={visit.generalNotes} /></div><div className="space-y-2"><Label htmlFor="outcome">Resultado</Label><NativeSelect id="outcome" name="outcome" className="h-11 w-full"><NativeSelectOption value="COMPLETED">Terminado</NativeSelectOption><NativeSelectOption value="PENDING_PART">Pendiente de pieza</NativeSelectOption><NativeSelectOption value="PENDING_RETURN">Pendiente de volver otro día</NativeSelectOption></NativeSelect></div><div className="space-y-2"><Label htmlFor="signerName">Nombre de quien firma</Label><Input id="signerName" name="signerName" className="h-11" /></div><div className="space-y-2"><Label>Firma del cliente</Label><SignaturePad /></div></CardContent></Card>
      <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" formAction={saveVisitAction} variant="outline" size="lg" className="h-11"><Save /> Guardar borrador</Button><Button type="submit" formAction={completeVisitAction} size="lg" className="h-11 bg-[#087f86] hover:bg-[#076970]">Finalizar y generar PDF</Button></div>
    </form>
  </main>;
}
