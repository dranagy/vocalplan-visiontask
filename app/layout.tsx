import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VocalPlan",
  description: "AI-powered voice task organizer using the Eisenhower Matrix",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
