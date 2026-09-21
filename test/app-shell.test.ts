import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";
import type { CurrentUser } from "@/lib/auth";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/app/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/components/webmcp-tools", () => ({ WebMcpTools: () => null }));

const office: CurrentUser = { id: "oficina", username: "oficina", displayName: "Oficina", role: "OFFICE" };
const technician: CurrentUser = { id: "tecnico", username: "tecnico", displayName: "Técnico", role: "TECHNICIAN" };

beforeEach(() => vi.mocked(usePathname).mockReturnValue("/dashboard"));

describe("AppShell", () => {
  it("reserva espacio para la barra móvil de oficina sin perder el contenido", () => {
    const html = renderToStaticMarkup(createElement(AppShell, { user: office } as Parameters<typeof AppShell>[0], createElement("p", null, "Contenido de prueba")));
    expect(html).toContain("pb-20 lg:pb-0");
    expect(html).toContain("Contenido de prueba");
  });

  it("reserva el mismo espacio para la nueva barra móvil del técnico", () => {
    const html = renderToStaticMarkup(createElement(AppShell, { user: technician } as Parameters<typeof AppShell>[0], createElement("p", null, "Parte de trabajo")));
    expect(html).toContain("pb-20 lg:pb-0");
    expect(html).toContain('aria-label="Navegación móvil"');
    expect(html).toContain('href="/calculadora"');
  });

  it("conserva el acceso al resumen desde el logotipo y la salida", () => {
    const html = renderToStaticMarkup(createElement(AppShell, { user: technician } as Parameters<typeof AppShell>[0], createElement("span", null, "Calculadora")));
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Cerrar sesión");
    expect(html).toContain("Calculadora");
  });
});
