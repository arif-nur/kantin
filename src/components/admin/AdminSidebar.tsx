"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  Store,
  CreditCard,
  FileBarChart,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import AppLogo from "@/components/ui/AppLogo";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, userProfile } = useAuth();

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsCrossed },
    { href: "/admin/pesanan", label: "Pesanan Masuk", icon: Receipt },
    { href: "/admin/pemesan", label: "Data Pemesan", icon: Users },
    { href: "/admin/kantin", label: "Data Kantin", icon: Store },
    { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
    { href: "/admin/laporan", label: "Laporan Penjualan", icon: FileBarChart },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#082215] text-white flex flex-col justify-between flex-shrink-0 min-h-screen border-r border-emerald-950/40 select-none hidden md:flex">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-emerald-900/30">
          <AppLogo className="w-9 h-9 rounded-xl shadow-sm" />
          <div>
            <h2 className="font-extrabold text-sm tracking-wide text-white">Kantin Admin</h2>
            <p className="text-[10px] text-emerald-400 font-medium">Panel Pengelola</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-500/70 mb-2">
            Menu Utama
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-900/30 font-extrabold"
                    : "text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-400/80"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-emerald-900/30 space-y-2">
        <Link
          href="/menu"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/50 transition border border-emerald-800/40"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Menu Mahasiswa
          </span>
          <span className="text-[9px] bg-brand-500 text-white px-1.5 py-0.5 rounded font-black">
            PWA
          </span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Admin</span>
        </button>
      </div>
    </aside>
  );
}
