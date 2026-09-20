import Link from "next/link";
import { Fan, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { AppNavigation } from "@/components/app-navigation";
import { WebMcpTools } from "@/components/webmcp-tools";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f6f5] text-[#12333d]">
      <WebMcpTools canCreate={user.role === "OFFICE"} />
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-[256px] shrink-0 flex-col bg-[#12333d] px-5 py-7 text-white lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <span className="grid size-11 place-items-center rounded-lg bg-[#d9f2ef] text-[#087f86]"><Fan className="size-6" strokeWidth={2.2} /></span>
            <span><span className="font-display block text-xl font-bold leading-none tracking-[-0.04em]">ClimaControl</span><span className="mt-1 block text-xs font-medium text-[#a5c7c9]">Servicio en campo</span></span>
          </Link>
          <AppNavigation role={user.role} variant="desktop" />
          <div className="mt-auto border-t border-[#315760] px-2 pt-5">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="mt-0.5 text-xs text-[#a5c7c9]">{user.role === "OFFICE" ? "Oficina" : "Técnico"}</p>
            <form action={logoutAction}>
              <button type="submit" className="mt-4 flex min-h-10 w-full items-center gap-2 text-sm font-semibold text-[#c0d3d5] hover:text-white">
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </form>
          </div>
        </aside>
        <div className={`min-w-0 flex-1 ${user.role === "OFFICE" ? "pb-20 lg:pb-0" : ""}`}>
          <header className="flex h-[72px] items-center justify-between border-b border-[#d2e2e2] bg-white px-4 sm:px-7 lg:px-10">
            <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
              <span className="grid size-9 place-items-center rounded-lg bg-[#12333d] text-[#9de0dc]"><Fan className="size-5" /></span>
              <span className="font-display text-lg font-bold tracking-[-0.035em]">ClimaControl</span>
            </Link>
            <p className="hidden text-sm font-semibold text-[#58717a] lg:block">{user.role === "OFFICE" ? "Centro de servicio" : "Trabajo de campo"}</p>
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block"><span className="block text-sm font-semibold">{user.displayName}</span><span className="block text-xs text-[#58717a]">{user.role === "OFFICE" ? "Oficina" : "Técnico"}</span></span>
              <form action={logoutAction} className="lg:hidden">
                <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className="grid size-10 place-items-center rounded-lg border border-[#d2e2e2] text-[#45636b] hover:bg-[#e6f4f3]">
                  <LogOut className="size-[18px]" />
                </button>
              </form>
            </div>
          </header>
          {children}
        </div>
      </div>
      <AppNavigation role={user.role} variant="mobile" />
    </div>
  );
}
