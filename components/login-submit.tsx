"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginSubmit() {
  const { pending } = useFormStatus();

  return (
    <>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        aria-busy={pending}
        className="h-12 w-full text-base font-semibold disabled:cursor-wait disabled:opacity-100"
      >
        {pending ? (
          <><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Contectando..</>
        ) : (
          <>Entrar <ArrowRight className="size-4" aria-hidden="true" /></>
        )}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? "Comprobando tus datos de acceso." : ""}
      </span>
    </>
  );
}
