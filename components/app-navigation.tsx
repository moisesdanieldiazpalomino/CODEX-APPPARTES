"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator as CalculatorIcon, ClipboardList, MoreHorizontal, UserCog, UsersRound, Wrench } from "lucide-react";
import type { UserRole } from "@/lib/domain";

const officeLinks = [
  { href: "/trabajos", label: "Trabajos", icon: ClipboardList },
  { href: "/clientes", label: "Clientes y máquinas", icon: UsersRound },
  { href: "/calculadora", label: "Calculadora", icon: CalculatorIcon },
  { href: "/propuestas", label: "Propuestas", icon: Wrench },
  { href: "/usuarios", label: "Usuarios", icon: UserCog },
];

const technicianLinks = [
  { href: "/dashboard", label: "Mis trabajos", icon: ClipboardList },
  { href: "/calculadora", label: "Calculadora", icon: CalculatorIcon },
];

export function AppNavigation({ role, variant }: { role: UserRole; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const links = role === "OFFICE" ? officeLinks : technicianLinks;
  const isCurrent = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  if (variant === "desktop") return (
      <nav className="mt-11 space-y-1.5" aria-label="Navegación principal">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            className={`group flex min-h-12 items-center gap-3 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-offset-2 ${isCurrent(href) ? "bg-[#d9f2ef] text-[#12333d]" : "text-[#c0d3d5] hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className={`size-[19px] ${isCurrent(href) ? "text-[#087f86]" : "text-[#80c6c6] group-hover:text-white"}`} />
            {label}
          </Link>
        ))}
      </nav>
  );
  return role === "OFFICE" ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#d2e2e2] bg-white px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(18,51,61,0.08)] lg:hidden" aria-label="Navegación móvil">
          {links.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold ${isCurrent(href) ? "bg-[#e6f4f3] text-[#075f65]" : "text-[#58717a]"}`}>
              <Icon className="size-5" />
              {label === "Clientes y máquinas" ? "Clientes" : label}
            </Link>
          ))}
          <details className="group relative">
            <summary className={`flex min-h-12 cursor-pointer list-none flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold [&::-webkit-details-marker]:hidden ${links.slice(2).some(({ href }) => isCurrent(href)) ? "bg-[#e6f4f3] text-[#075f65]" : "text-[#58717a]"}`}>
              <MoreHorizontal className="size-5" /> Más
            </summary>
            <div className="absolute bottom-[calc(100%+0.8rem)] right-0 w-48 rounded-xl border border-[#d2e2e2] bg-white p-2 shadow-[0_16px_40px_rgba(18,51,61,0.18)]">
              {links.slice(2).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={(event) => { const details = event.currentTarget.closest("details"); if (details) details.open = false; }} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#12333d] hover:bg-[#e6f4f3]">
                  <Icon className="size-4 text-[#087f86]" /> {label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
  ) : (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-[#d2e2e2] bg-white px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(18,51,61,0.08)] lg:hidden" aria-label="Navegación móvil">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold ${isCurrent(href) ? "bg-[#e6f4f3] text-[#075f65]" : "text-[#58717a]"}`}>
              <Icon className="size-5" aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
  );
}
