import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useFormStatus } from "react-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateUserSubmit } from "@/components/create-user-submit";
import { FormMessage } from "@/components/form-message";
import { LoginSubmit } from "@/components/login-submit";

vi.mock("react-dom", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-dom")>(),
  useFormStatus: vi.fn(),
}));

function setPending(pending: boolean) {
  vi.mocked(useFormStatus).mockReturnValue({ pending } as ReturnType<typeof useFormStatus>);
}

beforeEach(() => setPending(false));

describe("LoginSubmit", () => {
  it("muestra Entrar y permite el envío antes de iniciar sesión", () => {
    const html = renderToStaticMarkup(createElement(LoginSubmit));
    expect(html).toContain("Entrar");
    expect(html).not.toContain(' disabled=""');
    expect(html).not.toContain("Contectando..");
  });

  it("muestra Contectando.. e impide enviar dos veces mientras autentica", () => {
    setPending(true);
    const html = renderToStaticMarkup(createElement(LoginSubmit));
    expect(html).toContain("Contectando..");
    expect(html).toContain(' disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it("anuncia la comprobación de acceso sin depender de la animación", () => {
    setPending(true);
    const html = renderToStaticMarkup(createElement(LoginSubmit));
    expect(html).toContain("Comprobando tus datos de acceso.");
    expect(html).toContain('role="status"');
    expect(html).toContain("motion-reduce:animate-none");
  });
});

describe("CreateUserSubmit", () => {
  it("permite crear el usuario cuando el formulario está listo", () => {
    const html = renderToStaticMarkup(createElement(CreateUserSubmit));
    expect(html).toContain("Crear usuario");
    expect(html).not.toContain(' disabled=""');
    expect(html).not.toContain("Se está creando");
  });

  it("cambia el botón y bloquea envíos repetidos durante el alta", () => {
    setPending(true);
    const html = renderToStaticMarkup(createElement(CreateUserSubmit));
    expect(html).toContain("Creando usuario...");
    expect(html).toContain(' disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it("muestra y anuncia un mensaje visible mientras se crea", () => {
    setPending(true);
    const html = renderToStaticMarkup(createElement(CreateUserSubmit));
    expect(html).toContain("Se está creando el nuevo usuario. Espera un momento.");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});

it("muestra las credenciales incorrectas como alerta en el acceso", () => {
  const html = renderToStaticMarkup(createElement(FormMessage, { error: "Usuario o contraseña incorrectos." }));
  expect(html).toContain("Usuario o contraseña incorrectos.");
  expect(html).toContain('role="alert"');
});
