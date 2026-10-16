"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { DataService } from "@/lib/data-service";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, logout, isSuperAdmin, isPengelolaKantin, managedKantinId, managedKantinNama } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    const unsub = DataService.subscribePendingOrdersCount((count) => {
      setPendingCount(count);
    }, managedKantinId || undefined);
    return () => unsub();
  }, [managedKantinId]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/admin/pesanan?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const allLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsCrossed },
    { href: "/admin/pesanan", label: "Pesanan Masuk", icon: Receipt },
    { href: "/admin/pemesan", label: "Data Pemesan", icon: Users, superAdminOnly: true },
    { href: "/admin/kantin", label: "Data Kantin", icon: Store, superAdminOnly: true },
    { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
    { href: "/admin/laporan", label: "Laporan Penjualan", icon: FileBarChart },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  const visibleLinks = allLinks.filter((l) => {
    if (l.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  const adminInitials = userProfile?.namaPemesan
    ? userProfile.namaPemesan.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-extrabold text-sm text-gray-900">Admin Kantin</span>
        </div>

        {/* Global Search & Canteen Identity */}
        <div className="hidden sm:flex items-center gap-3">
          <form onSubmit={handleGlobalSearch} className="relative w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Cari pesanan (B001), menu..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white transition"
            />
          </form>

          {isPengelolaKantin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              {managedKantinNama || "Kantin Anda"}
            </span>
          )}

          {isSuperAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Semua Kantin (Super Admin)
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#16a34a] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Menu Mahasiswa
          </Link>

          {/* Notification icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
              aria-label="Notifikasi Pesanan"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-extrabold text-gray-900">Notifikasi Pesanan</span>
                  <span className="text-[10px] font-bold text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pendingCount} baru
                  </span>
                </div>
                <div className="py-2.5">
                  {pendingCount > 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-medium space-y-1">
                      <p className="font-bold">Ada {pendingCount} pesanan menunggu!</p>
                      <p className="text-[11px] text-amber-700">
                        Harap segera konfirmasi pesanan masuk dari mahasiswa.
                      </p>
                      <Link
                        href="/admin/pesanan"
                        onClick={() => setShowNotificationMenu(false)}
                        className="inline-block mt-1 text-[11px] font-extrabold text-amber-950 underline"
                      >
                        Buka Antrean Pesanan &rarr;
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">
                      Semua antrean pesanan telah diproses.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {adminInitials}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-gray-900 leading-tight">
                {userProfile?.namaPemesan || "Admin Kantin"}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">
                {isSuperAdmin ? "Super Admin" : "Pengelola Kantin"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex">
          <div className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between h-full p-4 animate-fade-in border-r border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <span className="font-bold text-sm text-white">Menu Navigasi</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#16a34a] text-white font-bold"
                          : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-[#16a34a] text-white text-xs font-bold rounded-xl"
              >
                Tampilan Mahasiswa
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 rounded-xl"
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
