import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Layout from "./layout.c";
import { THEME_SCRIPT } from "@/lib/theme-script";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "TableGo",
  description: "Find a restaurant and book a table in a few clicks",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the theme script adds `dark` before React hydrates
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
