"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  ChefHat,
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
  const { logout, isSuperAdmin, isPengelolaKantin, managedKantinNama } = useAuth();

  const allLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/pesanan", label: "Pesanan Masuk", icon: Receipt },
    { href: "/admin/dapur", label: "Dapur & KDS", icon: ChefHat },
    { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsCrossed },
    { href: "/admin/pemesan", label: "Data Pemesan", icon: Users, superAdminOnly: true },
    { href: "/admin/kantin", label: "Data Kantin", icon: Store, superAdminOnly: true },
    { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
    { href: "/admin/laporan", label: "Laporan Penjualan", icon: FileBarChart },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  const visibleLinks = allLinks.filter((link) => {
    if (link.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col justify-between flex-shrink-0 min-h-screen border-r border-slate-800 select-none hidden md:flex">
      <div>
        {/* Logo & Role Identity */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <AppLogo className="w-8 h-8 rounded-xl shadow-xs" />
          <div className="min-w-0">
            <h2 className="font-bold text-sm tracking-tight text-white truncate">Kantin Admin</h2>
            <p className="text-[10px] text-emerald-400 font-medium truncate">
              {isPengelolaKantin ? managedKantinNama || "Pengelola Kantin" : "Super Administrator"}
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 mt-2">
            Menu Utama
          </p>
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#16a34a] text-white shadow-xs font-bold"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <Link
          href="/menu"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            Menu Mahasiswa
          </span>
          <span className="text-[9px] bg-[#16a34a] text-white px-1.5 py-0.2 rounded font-bold">
            PWA
          </span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
