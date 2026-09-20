import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimaControl | Partes de trabajo",
  description: "Gestión de trabajos, visitas y equipos de climatización.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
