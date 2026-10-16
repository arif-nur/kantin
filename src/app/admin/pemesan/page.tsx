"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Shield, User, Phone, MapPin, Mail, CheckCircle2, Store, Edit2, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { UserProfile, UserRole, Kantin } from "@/types";

export default function AdminPemesanPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("pemesan");
  const [selectedKantinId, setSelectedKantinId] = useState<string>("");
  const [savingRole, setSavingRole] = useState(false);

  const loadData = async () => {
    await DataService.initIfEmpty();
    const [u, k] = await Promise.all([
      DataService.getUsers(),
      DataService.getKantinList(),
    ]);
    setUsers(u);
    setKantinList(k);
    if (k.length > 0) {
      setSelectedKantinId(k[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRoleModal = (u: UserProfile) => {
    setEditingUser(u);
    setSelectedRole(u.role || "pemesan");
    setSelectedKantinId(u.kantinId || kantinList[0]?.id || "");
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSavingRole(true);
    try {
      const kantinTarget = kantinList.find((k) => k.id === selectedKantinId);
      const updates: Partial<UserProfile> = {
        role: selectedRole,
        kantinId: selectedRole === "pengelola_kantin" ? selectedKantinId : undefined,
        namaKantinKelola: selectedRole === "pengelola_kantin" ? kantinTarget?.namaKantin || "" : undefined,
      };

      await DataService.updateUserProfile(editingUser.uid, updates);
      setEditingUser(null);
      await loadData();
    } catch (e) {
      console.error("Gagal simpan role:", e);
      alert("Gagal mengubah role pengguna.");
    } finally {
      setSavingRole(false);
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
              Data Pemesan & Hak Akses
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola data profil pengguna kampus dan atur role (Mahasiswa, Pengelola Kantin, atau Super Admin)
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
              <option value="pengelola_kantin">Pengelola Kantin</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Kelas / Alamat</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Memuat data pengguna...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ada data pengguna ditemukan.
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
                        {user.role === "admin" ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Super Admin
                          </span>
                        ) : user.role === "pengelola_kantin" ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 flex items-center gap-1 w-max">
                            <Store className="w-3 h-3" />
                            {user.namaKantinKelola || "Tenant Kantin"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#16a34a]">
                            Mahasiswa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openRoleModal(user)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-gray-500" />
                          <span>Ubah Role</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Role Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in border border-gray-100">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Atur Role Pengguna
                  </h3>
                  <p className="text-[11px] text-gray-500">{editingUser.namaPemesan}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pilih Tingkat Akses (Role)
                </label>
                <div className="space-y-2">
                  {[
                    { id: "pemesan", label: "Mahasiswa (Pemesan)", desc: "Akses belanja menu kantin" },
                    { id: "pengelola_kantin", label: "Pengelola Kantin (Tenant)", desc: "Hanya akses dapur & menu stand miliknya" },
                    { id: "admin", label: "Super Admin", desc: "Akses penuh ke semua stand dan pengaturan" },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                        selectedRole === r.id
                          ? "border-[#16a34a] bg-emerald-50/60 ring-1 ring-[#16a34a]"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.id}
                        checked={selectedRole === r.id}
                        onChange={() => setSelectedRole(r.id as UserRole)}
                        className="mt-0.5 text-[#16a34a] focus:ring-[#16a34a]"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{r.label}</p>
                        <p className="text-[10px] text-gray-400">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedRole === "pengelola_kantin" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilih Stand Kantin Yang Dikelola
                  </label>
                  <select
                    value={selectedKantinId}
                    onChange={(e) => setSelectedKantinId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-[#16a34a] outline-none"
                  >
                    {kantinList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKantin}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={savingRole}
                  className="flex-1 py-2.5 bg-[#16a34a] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {savingRole ? "Menyimpan..." : "Simpan Role"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
