import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SidebarProvider } from "@/components/SidebarContext";
import { TransactionViewModeProvider } from "@/components/TransactionViewModeContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumina | Dairy Terminal",
  description: "Dairy Supply Chain Intelligence",
};

import MobileBlocker from "@/components/MobileBlocker";

import { GlobalToaster } from "@/components/GlobalToaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-surface text-on-surface">
        <MobileBlocker />
        <GlobalToaster />
        <TransactionViewModeProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </TransactionViewModeProvider>
      </body>
    </html>
  );
}
