import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cocon Marketing Dashboard",
  description: "Marketing automations health and overview",
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
