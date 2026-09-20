"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateUserSubmit() {
  const { pending } = useFormStatus();

  return (
    <>
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-11 w-full bg-[#087f86] hover:bg-[#076970] disabled:cursor-wait disabled:opacity-100"
      >
        {pending ? (
          <><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Creando usuario...</>
        ) : "Crear usuario"}
      </Button>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-[#58717a]">
        {pending ? "Se está creando el nuevo usuario. Espera un momento." : ""}
      </p>
    </>
  );
}
