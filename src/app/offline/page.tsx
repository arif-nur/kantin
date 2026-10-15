"use client";

import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-gray-100 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Koneksi Terputus</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Sepertinya perangkat Anda sedang offline. Silakan periksa koneksi Wi-Fi atau data seluler Anda untuk melanjutkan pemesanan makanan.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-floating flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl transition text-sm"
          >
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
