import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkAgente — Tu link inmobiliario",
  description:
    "Perfil, propiedades, redes sociales y captación de leads en un solo link para agentes inmobiliarios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
