import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noches de Luna | Inventario",
  description: "Inventario y ventas para licorera, bar o discoteca."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
