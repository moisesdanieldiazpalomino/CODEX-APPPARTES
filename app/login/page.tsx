import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Fan } from "lucide-react";
import { loginAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { LoginSubmit } from "@/components/login-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ total }] = await getDb().select({ total: count() }).from(users);
  if (total === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel vent-pattern" aria-label="ClimaControl">
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-[#d9f2ef] text-[#087f86]"><Fan className="size-7" /></span>
          <span className="font-display text-2xl font-bold tracking-[-0.04em]">ClimaControl</span>
        </div>
        <div className="relative z-10 max-w-[34rem]">
          <h1 className="font-display text-[clamp(2.8rem,5vw,5rem)] font-bold leading-[1.02] tracking-[-0.055em]">Cada visita, bien registrada.</h1>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-[#c7dedf]">La oficina organiza los trabajos. El técnico completa el parte junto al equipo. El historial queda listo para la próxima visita.</p>
        </div>
        <p className="relative z-10 text-sm text-[#9fc2c5]">Pensado para la oficina y el trabajo en campo.</p>
      </section>
      <div className="auth-form-wrap">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="grid size-11 place-items-center rounded-lg bg-[#12333d] text-[#9de0dc]"><Fan className="size-6" /></span>
          <span className="font-display text-xl font-bold tracking-[-0.04em]">ClimaControl</span>
        </div>
        <div className="auth-form-card">
          <h2 className="font-display text-3xl font-bold tracking-[-0.04em]">Entrar a ClimaControl</h2>
          <p className="mt-2 text-sm text-[#58717a]">Usa el acceso que te ha asignado la oficina.</p>
          <form action={loginAction} className="mt-7 space-y-5">
            <FormMessage error={error} />
            <div className="space-y-2"><Label htmlFor="username">Usuario</Label><Input id="username" name="username" autoComplete="username" className="h-12" required autoFocus /></div>
            <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><Input id="password" name="password" type="password" autoComplete="current-password" className="h-12" required /></div>
            <LoginSubmit />
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-[#58717a]">Aplicación local · Datos protegidos en Supabase</p>
      </div>
    </main>
  );
}
