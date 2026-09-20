"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Tool = {
  name: string; title: string; description: string; inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;
};

export function WebMcpTools({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool(tool: Tool, options?: { signal?: AbortSignal }): void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: "open_work_order", title: "Abrir trabajo",
        description: "Abre el detalle de una orden de trabajo existente usando su identificador interno.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        async execute(input) {
          if (typeof input.id !== "string" || !input.id) throw new Error("Se requiere un identificador de trabajo.");
          router.push(`/trabajos/${encodeURIComponent(input.id)}`);
          return { opened: true, id: input.id };
        },
      }, { signal: lifecycle.signal });
      if (canCreate) await context.registerTool({
        name: "start_work_order_creation", title: "Preparar nuevo trabajo",
        description: "Abre el formulario visible para registrar una nueva orden de trabajo; no la guarda todavía.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        async execute() { router.push("/trabajos/nuevo"); return { opened: true }; },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [canCreate, router]);
  return null;
}
