"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  Store,
  CreditCard,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function AdminHeader() {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-extrabold text-sm text-gray-900">Admin Kantin</span>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center relative w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Cari menu, nomor pesanan, pemesan..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
          />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka App Mahasiswa
          </Link>

          {/* Notification icon */}
          <div className="relative">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-2 right-2 ring-2 ring-white"></span>
            </button>
          </div>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#082215] text-emerald-400 font-extrabold text-xs flex items-center justify-center shadow-xs">
              AD
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-gray-900 leading-tight">
                {userProfile?.namaPemesan || "Admin Kantin"}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex">
          <div className="w-64 bg-[#082215] text-white flex flex-col justify-between h-full p-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40 mb-4">
                <span className="font-bold text-sm text-white">Menu Navigasi</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-brand-600 text-white font-extrabold"
                          : "text-emerald-100/70 hover:bg-emerald-900/40"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-900/40 space-y-2">
              <Link
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
              >
                Tampilan Mahasiswa
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-xl"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
