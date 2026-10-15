"use client";

import React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { User, ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { Kantin } from "@/types";
import AppLogo from "@/components/ui/AppLogo";

interface StudentHeaderProps {
  kantinList: Kantin[];
  selectedKantinId: string;
  onSelectKantin: (id: string) => void;
}

export default function StudentHeader({
  kantinList,
  selectedKantinId,
  onSelectKantin,
}: StudentHeaderProps) {
  const { userProfile, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const currentKantin = kantinList.find((k) => k.id === selectedKantinId) || kantinList[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Kantin Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 text-left py-1 px-2.5 rounded-2xl hover:bg-emerald-50/60 transition group border border-transparent hover:border-emerald-100"
          >
            <div className="flex-shrink-0 group-hover:scale-105 transition">
              <AppLogo className="w-9 h-9 rounded-xl shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                <span>Pilih Kantin</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:translate-y-0.5 transition" />
              </div>
              <div className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-xs">
                {currentKantin?.namaKantin || "Pilih Kantin"}
              </div>
            </div>
          </button>

          {/* Kantin Dropdown Menu */}
          {showDropdown && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Daftar Kantin Sekolah
              </div>
              {kantinList.map((kantin) => (
                <button
                  key={kantin.id}
                  onClick={() => {
                    onSelectKantin(kantin.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition ${
                    selectedKantinId === kantin.id
                      ? "bg-brand-50 text-brand-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <div>{kantin.namaKantin}</div>
                    <div className="text-[11px] text-gray-400 font-normal truncate max-w-[190px]">
                      {kantin.alamatKantin}
                    </div>
                  </div>
                  {selectedKantinId === kantin.id && (
                    <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Navigation */}
        <div className="flex items-center gap-2">

          {userProfile ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-gray-100 transition"
              >
                <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {userProfile.namaPemesan.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-gray-900 truncate max-w-[100px]">
                    {userProfile.namaPemesan}
                  </p>
                  <p className="text-gray-400 text-[10px] uppercase font-semibold">
                    {userProfile.kodePemesan}
                  </p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Masuk sebagai</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {userProfile.namaPemesan}
                    </p>
                    <p className="text-xs text-brand-600 font-semibold">{userProfile.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/akun"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      Akun & Profil Saya
                    </Link>
                    <Link
                      href="/pesanan-saya"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      Riwayat Pesanan Saya
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl"
                      >
                        Dashboard Admin Kantin
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <User className="w-4 h-4" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
