import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "CAAP BAMC Financial Records",
    template: "%s | CAAP BAMC Financial Records",
  },
  description:
    "Employee financial records management for CAAP BAMC Bacolod-Silay Airport.",
  applicationName: "CAAP BAMC Financial Records",
  icons: {
    icon: "/brand/caap-logo.png",
    apple: "/brand/caap-logo.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <Toaster closeButton position="top-right" richColors />
      </body>
    </html>
  );
}
