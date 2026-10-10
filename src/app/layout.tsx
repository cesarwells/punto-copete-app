import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// Todo se lee en vivo desde la base de datos (saldos, premios, promociones).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Punto Copete — Club de puntos", template: "%s · Punto Copete" },
  description: "Suma puntos con cada compra en Punto Copete y canjéalos por premios.",
};

export const viewport: Viewport = { themeColor: "#7c2d12" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
