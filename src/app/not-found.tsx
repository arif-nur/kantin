import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-gray-100">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-brand-600 flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/menu"
          className="inline-block w-full py-3 px-4 bg-[#1b432a] hover:bg-[#153621] text-white font-bold text-xs rounded-2xl shadow-floating transition"
        >
          Kembali ke Menu Utama
        </Link>
      </div>
    </div>
  );
}
