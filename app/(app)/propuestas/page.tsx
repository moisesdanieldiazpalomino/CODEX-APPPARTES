import Link from "next/link";
import { eq } from "drizzle-orm";
import { reviewProposalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/db";
import { locations, machineProposals, workOrders } from "@/db/schema";
import { requireOffice } from "@/lib/auth";

export default async function ProposalsPage() {
  await requireOffice();
  const rows = await getDb().select({ proposal: machineProposals, location: locations, order: workOrders }).from(machineProposals).innerJoin(locations, eq(machineProposals.locationId, locations.id)).innerJoin(workOrders, eq(machineProposals.workOrderId, workOrders.id)).where(eq(machineProposals.status, "PENDING"));
  return <main className="app-main"><p className="eyebrow">Inventario</p><h1 className="page-title">Propuestas de máquinas</h1><p className="page-subtitle">Revisa las máquinas nuevas indicadas por los técnicos.</p><div className="mt-6 grid gap-5 lg:grid-cols-2">{rows.map(({ proposal, location, order }) => <Card key={proposal.id} className="gap-4 border-[#d2e2e2] bg-white"><CardHeader><CardTitle>{proposal.proposedCode} · {proposal.proposedType}</CardTitle><p className="text-sm text-slate-500">{location.name} · <Link href={`/trabajos/${order.id}`} className="font-semibold text-[#087f86]">{order.number}</Link></p></CardHeader><CardContent><div className="grid gap-2 text-sm sm:grid-cols-2"><p><strong>Marca:</strong> {proposal.proposedBrand || "—"}</p><p><strong>Modelo:</strong> {proposal.proposedModel || "—"}</p><p><strong>Serie:</strong> {proposal.proposedSerialNumber || "—"}</p><p><strong>Ubicación:</strong> {proposal.proposedInternalLocation || "—"}</p></div>{proposal.proposedNotes && <p className="mt-3 rounded-xl bg-[#f1f8f7] p-3 text-sm">{proposal.proposedNotes}</p>}<form action={reviewProposalAction} className="mt-4 space-y-3"><input type="hidden" name="proposalId" value={proposal.id} /><Label htmlFor={`note_${proposal.id}`}>Nota de revisión</Label><Input id={`note_${proposal.id}`} name="reviewNotes" /><div className="flex gap-2"><Button type="submit" name="decision" value="APPROVED" className="bg-[#087f86] hover:bg-[#076970]">Aprobar</Button><Button type="submit" name="decision" value="REJECTED" variant="outline">Rechazar</Button></div></form></CardContent></Card>)}{!rows.length && <p className="rounded-2xl border border-[#d2e2e2] bg-white p-8 text-slate-500">No hay propuestas pendientes.</p>}</div></main>;
}
