"use client";

import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAuth } from "@/lib/context/AuthContext";
import { ShieldAlert, LogIn } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#082215] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-gray-100 animate-fade-in space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Akses Khusus Admin</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Halaman ini hanya dapat diakses oleh Admin Pengelola Kantin Sekolah.
          </p>
          <div className="pt-2 space-y-2">
            <a
              href="/login"
              className="w-full py-3 px-4 bg-[#082215] hover:bg-[#05170e] text-emerald-400 font-extrabold text-xs rounded-2xl shadow-floating flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" />
              Masuk dengan Akun Admin
            </a>
            <a
              href="/menu"
              className="block py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Kembali ke Menu Mahasiswa
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f6] flex flex-row">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
