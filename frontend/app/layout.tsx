import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intervue - Precision Training",
  description: "Master the mock interview with AI-powered precision training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "antialiased", manrope.variable)}>
      <head>
        {/* Material Symbols */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* Fontshare — Clash Grotesk + General Sans */}
        <link href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@700&f[]=general-sans@300,400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body className="muddy-bg text-ed-beige selection:bg-[#DC9F85] selection:text-[#181818] overflow-x-hidden body-font min-h-screen">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
