import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ArrowRight, Fan } from "lucide-react";
import { setupAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ total }] = await getDb().select({ total: count() }).from(users);
  if (total > 0) redirect("/login");
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel vent-pattern" aria-label="ClimaControl">
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-[#d9f2ef] text-[#087f86]"><Fan className="size-7" /></span>
          <span className="font-display text-2xl font-bold tracking-[-0.04em]">ClimaControl</span>
        </div>
        <div className="relative z-10 max-w-[34rem]">
          <h1 className="font-display text-[clamp(2.8rem,5vw,5rem)] font-bold leading-[1.02] tracking-[-0.055em]">El trabajo empieza aquí.</h1>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-[#c7dedf]">Prepara la cuenta de oficina. Después podrás registrar técnicos, clientes, locales y equipos para empezar a emitir partes.</p>
        </div>
        <p className="relative z-10 text-sm text-[#9fc2c5]">Configuración inicial · Solo una vez</p>
      </section>
      <div className="auth-form-wrap">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="grid size-11 place-items-center rounded-lg bg-[#12333d] text-[#9de0dc]"><Fan className="size-6" /></span>
          <span className="font-display text-xl font-bold tracking-[-0.04em]">ClimaControl</span>
        </div>
        <div className="auth-form-card">
          <h2 className="font-display text-3xl font-bold tracking-[-0.04em]">Preparar la aplicación</h2>
          <p className="mt-2 text-sm text-[#58717a]">Crea el acceso principal de oficina.</p>
          <form action={setupAction} className="mt-7 space-y-5">
            <FormMessage error={error} />
            <div className="space-y-2"><Label htmlFor="displayName">Nombre de la persona de oficina</Label><Input id="displayName" name="displayName" className="h-12" required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="username">Usuario</Label><Input id="username" name="username" className="h-12" required /></div>
              <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><Input id="password" name="password" type="password" minLength={10} className="h-12" required /></div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#d2e2e2] bg-[#f6faf9] p-4">
              <Checkbox name="demo" defaultChecked />
              <span><span className="block text-sm font-semibold">Cargar datos de demostración</span><span className="mt-1 block text-sm text-[#58717a]">Tres técnicos, dos clientes, locales, máquinas y trabajos de prueba.</span></span>
            </label>
            <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold">Crear aplicación <ArrowRight className="size-4" /></Button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-[#58717a]">Los datos permanecerán en el PC de la empresa</p>
      </div>
    </main>
  );
}
