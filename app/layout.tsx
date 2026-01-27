import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HighVibe",
  description: "High-frequency, unbiased enlightenment through sound and design."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

