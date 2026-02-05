import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HighVibe",
  description: "High-frequency, unbiased enlightenment through sound and design.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "HighVibe" },
  icons: { icon: "/icon.png", apple: "/icon.png" }
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body
        className="h-full bg-background text-foreground antialiased font-sans"
        style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}

