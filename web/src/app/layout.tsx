import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GovSync — Connected Government Services",
    template: "%s · GovSync",
  },
  description:
    "GovSync is an interoperability prototype that connects multiple government departments behind one application and one connected approval workflow. Simulated environment, SIH 2026.",
  applicationName: "GovSync",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
