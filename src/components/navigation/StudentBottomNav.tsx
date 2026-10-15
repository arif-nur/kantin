"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Receipt, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";

export default function StudentBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  const navItems = [
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/pesanan-saya", label: "Pesanan", icon: Receipt },
    { href: "/keranjang", label: "Keranjang", icon: ShoppingBag, badge: totalItems },
    { href: "/login", label: "Akun", icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href === "/menu" && pathname === "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              isActive ? "text-brand-600 font-bold" : "text-gray-400 hover:text-gray-600 font-medium"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 bg-brand-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
