"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { formatRupiah } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function FloatingBasket() {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();

  // Show only on /menu or /menu/[id] catalog when there are items
  if (totalItems === 0 || (!pathname.startsWith("/menu") && pathname !== "/")) {
    return null;
  }

  return (
    <aside aria-label="Ringkasan Keranjang Belanja" className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <Link
          href="/keranjang"
          className="w-full bg-[#0f3822] hover:bg-[#0c2e1c] text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 border border-emerald-700/50 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-300 font-semibold leading-tight">
                {totalItems} Menu Dipilih
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {formatRupiah(totalPrice)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/20 group-hover:bg-emerald-500 text-emerald-200 group-hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition">
            <span>Lihat Keranjang</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>
      </div>
    </aside>
  );
}
