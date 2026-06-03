import type { Metadata } from "next";
import "./globals.css";

const platformName =
  process.env.NEXT_PUBLIC_PLATFORM_NAME || "AFA Message Platform";
const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME || "Client";

export const metadata: Metadata = {
  title: `${platformName} · ${clientName}`,
  description: "Marketing automations dashboard — email, WhatsApp, and client health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
