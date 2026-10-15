"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Shield, User, Phone, MapPin, Mail, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { UserProfile, UserRole } from "@/types";

export default function AdminPemesanPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  const loadUsers = async () => {
    await DataService.initIfEmpty();
    const data = await DataService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (confirm(`Ubah role pengguna ini menjadi "${newRole}"?`)) {
      await DataService.updateUserRole(uid, newRole);
      loadUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.namaPemesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.kodePemesan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "semua" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Data Pemesan & Mahasiswa
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola data profil mahasiswa dan kontrol hak akses / role akun
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs">
              Total Pengguna: {users.length}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode (P001), nama, atau email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-500">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="semua">Semua Role</option>
              <option value="pemesan">Mahasiswa (Pemesan)</option>
              <option value="admin">Admin Kantin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Kode</th>
                  <th className="py-3.5 px-4 font-extrabold">Nama Lengkap</th>
                  <th className="py-3.5 px-4 font-extrabold">Kontak</th>
                  <th className="py-3.5 px-4 font-extrabold">Jurusan / Alamat</th>
                  <th className="py-3.5 px-4 font-extrabold">Email</th>
                  <th className="py-3.5 px-4 font-extrabold">Role</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Ubah Hak Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Memuat data pemesan...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ditemukan data pemesan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-black text-gray-900">{user.kodePemesan}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-brand-800 flex items-center justify-center font-extrabold text-xs">
                          {user.namaPemesan.charAt(0)}
                        </div>
                        <span>{user.namaPemesan}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{user.noTlp}</td>
                      <td className="py-3 px-4 text-gray-600">{user.alamatPemesan}</td>
                      <td className="py-3 px-4 text-gray-500">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-brand-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {user.role === "pemesan" ? (
                          <button
                            onClick={() => handleRoleChange(user.uid, "admin")}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition"
                          >
                            Jadikan Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.uid, "pemesan")}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition"
                          >
                            Jadikan Mahasiswa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
