import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import PWAInstaller from "@/components/pwa/PWAInstaller";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kantin Sekolah - Pemesanan Makanan & Minuman Online",
  description: "Aplikasi PWA Pemesanan Kantin Sekolah Modern, Cepat, dan Praktis untuk siswa dan admin kantin.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kantin Sekolah",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${montserrat.className} ${montserrat.variable} antialiased min-h-screen bg-[#f7faf7] text-gray-900 selection:bg-brand-500 selection:text-white`}>
        <AuthProvider>
          <CartProvider>
            <PWAInstaller />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
