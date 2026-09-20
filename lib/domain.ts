export const WORK_ORDER_STATUSES = [
  "REGISTERED",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_PART",
  "PENDING_RETURN",
  "COMPLETED",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];
export type VisitOutcome = "PENDING_PART" | "PENDING_RETURN" | "COMPLETED";
export type UserRole = "OFFICE" | "TECHNICIAN";

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  REGISTERED: "Registrado",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En curso",
  PENDING_PART: "Pendiente de pieza",
  PENDING_RETURN: "Pendiente de volver",
  COMPLETED: "Terminado",
};

export const TYPE_LABELS = {
  INSTALLATION: "Instalación",
  MAINTENANCE: "Mantenimiento",
  BREAKDOWN: "Avería",
} as const;

export const SLOT_LABELS = { MORNING: "Mañana", AFTERNOON: "Tarde" } as const;

export function visitScheduleError(date: string | null, slot: string | null, assigned: boolean) {
  if (date) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
      return "La fecha no es válida.";
    }
  }
  if (slot && slot !== "MORNING" && slot !== "AFTERNOON") return "La franja no es válida.";
  if (assigned && (!date || !slot)) return "Para asignar o iniciar una visita, indica fecha y franja.";
  return null;
}

const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  REGISTERED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["PENDING_PART", "PENDING_RETURN", "COMPLETED"],
  PENDING_PART: ["ASSIGNED"],
  PENDING_RETURN: ["ASSIGNED"],
  COMPLETED: ["ASSIGNED"],
};

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  return transitions[from].includes(to);
}

export function nextStatusForOutcome(outcome: VisitOutcome): WorkOrderStatus {
  return outcome;
}

export function canUserAccessWorkOrder(
  role: UserRole,
  userId: string,
  assignedTechnicianId: string | null,
) {
  return role === "OFFICE" || assignedTechnicianId === userId;
}

export type VisitCompletionInput = {
  startedAt?: string | null;
  endedAt?: string | null;
  signerName?: string | null;
  signatureDataUrl?: string | null;
  reports: Array<{
    problemFound?: string | null;
    workPerformed?: string | null;
    actionsTaken?: string | null;
  }>;
};

export function validateVisitCompletion(input: VisitCompletionInput) {
  const errors: string[] = [];
  if (!input.startedAt || !input.endedAt) errors.push("Indica las horas de inicio y finalización.");
  if (input.startedAt && input.endedAt && new Date(input.endedAt) < new Date(input.startedAt)) errors.push("La hora final no puede ser anterior a la inicial.");
  if (!input.signerName?.trim()) errors.push("Indica el nombre de la persona que firma.");
  if (!input.signatureDataUrl?.startsWith("data:image/png;base64,")) errors.push("Recoge la firma del cliente.");
  if (!input.reports.length) errors.push("Añade al menos una máquina al parte.");
  input.reports.forEach((report, index) => {
    if (!report.problemFound?.trim()) errors.push(`Indica el problema encontrado en la máquina ${index + 1}.`);
    if (!report.workPerformed?.trim() && !report.actionsTaken?.trim()) errors.push(`Indica el trabajo o las acciones realizadas en la máquina ${index + 1}.`);
  });
  return errors;
}

export function formatWorkOrderNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new Error("Año inválido");
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) throw new Error("Secuencia inválida");
  return `OT-${year}-${sequence.toString().padStart(4, "0")}`;
}

export function statusTone(status: WorkOrderStatus) {
  if (status === "COMPLETED") return "bg-[#e6f4ef] text-[#17694c] border-[#b5d9c7]";
  if (status === "IN_PROGRESS") return "bg-[#dff2f1] text-[#075f65] border-[#a9d4d1]";
  if (status === "PENDING_PART" || status === "PENDING_RETURN") return "bg-[#fff3e6] text-[#965019] border-[#ecc99e]";
  if (status === "ASSIGNED") return "bg-[#e8f1fb] text-[#2c5a77] border-[#c5d9eb]";
  return "bg-[#eef2f3] text-[#49646d] border-[#d4e1e3]";
}
