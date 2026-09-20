import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, statusTone, type WorkOrderStatus } from "@/lib/domain";

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return <Badge variant="outline" className={statusTone(status)}>{STATUS_LABELS[status]}</Badge>;
}
