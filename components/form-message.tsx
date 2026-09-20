import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <Alert variant={error ? "destructive" : "default"} className={success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : ""}>
      {error ? <AlertCircle /> : <CheckCircle2 />}
      <AlertDescription className={success ? "text-emerald-800" : ""}>{error ?? success}</AlertDescription>
    </Alert>
  );
}
