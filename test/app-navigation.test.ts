import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "@/components/app-navigation";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

beforeEach(() => vi.mocked(usePathname).mockReturnValue("/dashboard"));

describe("AppNavigation", () => {
  it("omite Resumen del menú lateral de oficina y conserva sus áreas de trabajo", () => {
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "OFFICE", variant: "desktop" }));
    expect(html).not.toContain("Resumen");
    expect(html).not.toContain('href="/dashboard"');
    expect(html).toContain("Trabajos");
    expect(html).toContain("Clientes y máquinas");
    expect(html).toContain("Propuestas");
    expect(html).toContain("Usuarios");
  });

  it("deja Trabajos y Clientes visibles en móvil y agrupa las demás áreas en Más", () => {
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "OFFICE", variant: "mobile" }));
    expect(html).not.toContain("Resumen");
    expect(html).not.toContain('href="/dashboard"');
    expect(html).toContain("grid-cols-3");
    expect(html).toContain("> Más");
    expect(html).toContain('href="/propuestas"');
    expect(html).toContain('href="/usuarios"');
    expect(html).toContain('href="/calculadora"');
  });

  it("mantiene Mis trabajos para técnicos sin mostrar Resumen", () => {
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "TECHNICIAN", variant: "desktop" }));
    expect(html).toContain("Mis trabajos");
    expect(html).toContain('href="/calculadora"');
    expect(html).not.toContain("Resumen");
  });

  it("sigue marcando la sección actual después de retirar el enlace", () => {
    vi.mocked(usePathname).mockReturnValue("/trabajos/ot-1");
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "OFFICE", variant: "desktop" }));
    expect(html).toMatch(/<a(?=[^>]*href="\/trabajos")(?=[^>]*aria-current="page")[^>]*>/);
  });

  it("incluye Calculadora en el lateral de oficina", () => {
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "OFFICE", variant: "desktop" }));
    expect(html).toMatch(/<a[^>]*href="\/calculadora"[^>]*>/);
    expect(html).toContain("Calculadora");
  });

  it("marca Más como activo en móvil de oficina al abrir la calculadora", () => {
    vi.mocked(usePathname).mockReturnValue("/calculadora");
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "OFFICE", variant: "mobile" }));
    expect(html).toContain('href="/calculadora"');
    expect(html.match(/<summary[^>]*>/)?.[0]).toContain("bg-[#e6f4f3]");
  });

  it("da acceso directo a la calculadora en móvil técnico", () => {
    vi.mocked(usePathname).mockReturnValue("/calculadora");
    const html = renderToStaticMarkup(createElement(AppNavigation, { role: "TECHNICIAN", variant: "mobile" }));
    expect(html).toContain('href="/dashboard"');
    expect(html).toMatch(/<a(?=[^>]*href="\/calculadora")(?=[^>]*aria-current="page")[^>]*>/);
    expect(html).toContain("grid-cols-2");
  });
});
