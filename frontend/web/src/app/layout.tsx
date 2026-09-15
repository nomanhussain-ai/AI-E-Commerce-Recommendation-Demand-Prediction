import type { Metadata } from "next";
import { Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { ThemeInit } from "@/components/layout/ThemeInit";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ShopIQ — AI-Powered Commerce",
    template: "%s · ShopIQ",
  },
  description:
    "AI-powered e-commerce platform: personalized recommendations and demand forecasting.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeInit />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
