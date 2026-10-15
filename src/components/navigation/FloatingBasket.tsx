"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { formatRupiah } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export default function FloatingBasket() {
  const pathname = usePathname();
  const { totalItems, totalPrice } = useCart();

  // Show only on /menu or /menu/[id] when there are items
  if (totalItems === 0 || pathname.startsWith("/keranjang") || pathname.startsWith("/checkout") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-40 animate-fade-in">
      <Link
        href="/keranjang"
        className="w-full bg-[#1b432a] hover:bg-[#153621] text-white py-3.5 px-5 rounded-3xl shadow-floating flex items-center justify-between transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-emerald-800/40"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#22c55e] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
            {totalItems}
          </div>
          <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            <span>Keranjang Saya</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-extrabold text-sm sm:text-base text-emerald-300">
            {formatRupiah(totalPrice)}
          </span>
        </div>
      </Link>
    </div>
  );
}
