import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter-tight";
import "./globals.css";

export const metadata: Metadata = {
  title: "Closing Tracker",
  description: "Track reserved off-plan deals from reservation to signed SPA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f7fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
