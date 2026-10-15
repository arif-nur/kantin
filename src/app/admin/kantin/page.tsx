"use client";

import React, { useEffect, useState } from "react";
import { Store, Plus, Edit2, Trash2, Phone, MapPin, CheckCircle2, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Kantin } from "@/types";

export default function AdminKantinPage() {
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKantin, setEditingKantin] = useState<Kantin | null>(null);

  // Form State
  const [kodeKantin, setKodeKantin] = useState("");
  const [namaKantin, setNamaKantin] = useState("");
  const [alamatKantin, setAlamatKantin] = useState("");
  const [noTlpKantin, setNoTlpKantin] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadKantin = async () => {
    await DataService.initIfEmpty();
    const data = await DataService.getKantinList();
    setKantinList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadKantin();
  }, []);

  const openCreateModal = () => {
    setEditingKantin(null);
    setKodeKantin(`K00${kantinList.length + 1}`);
    setNamaKantin("");
    setAlamatKantin("Jl. Rambutan, Kantin Sekolah Blok A1");
    setNoTlpKantin("081234567890");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (kantin: Kantin) => {
    setEditingKantin(kantin);
    setKodeKantin(kantin.kodeKantin);
    setNamaKantin(kantin.namaKantin);
    setAlamatKantin(kantin.alamatKantin);
    setNoTlpKantin(kantin.noTlpKantin);
    setIsActive(kantin.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKantin || !alamatKantin) return;

    const payload = {
      kodeKantin,
      namaKantin,
      alamatKantin,
      noTlpKantin,
      isActive,
    };

    if (editingKantin) {
      await DataService.updateKantin(editingKantin.id, payload);
    } else {
      await DataService.createKantin(payload);
    }

    setIsModalOpen(false);
    loadKantin();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data kantin ini?")) {
      await DataService.deleteKantin(id);
      loadKantin();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Data Kantin Sekolah
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Kelola daftar gerai/tenant kantin yang beroperasi di sekolah
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-floating transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kantin Baru</span>
          </button>
        </div>

        {/* Kantin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-8 text-gray-400">Memuat data kantin...</div>
          ) : kantinList.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-400">
              Belum ada kantin terdaftar.
            </div>
          ) : (
            kantinList.map((kantin) => (
              <div
                key={kantin.id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center font-black">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {kantin.kodeKantin}
                        </span>
                        <h3 className="font-extrabold text-base text-gray-900 mt-0.5">
                          {kantin.namaKantin}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        kantin.isActive
                          ? "bg-emerald-100 text-brand-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {kantin.isActive ? "Buka" : "Tutup"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 mt-4 bg-gray-50/80 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{kantin.alamatKantin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{kantin.noTlpKantin}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(kantin)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(kantin.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Kantin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingKantin ? "Edit Data Kantin" : "Tambah Kantin Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Kantin</label>
                  <input
                    type="text"
                    value={kodeKantin}
                    onChange={(e) => setKodeKantin(e.target.value)}
                    placeholder="K001"
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={noTlpKantin}
                    onChange={(e) => setNoTlpKantin(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kantin</label>
                <input
                  type="text"
                  value={namaKantin}
                  onChange={(e) => setNamaKantin(e.target.value)}
                  placeholder="Contoh: Barokah Food"
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alamat / Lokasi Kantin
                </label>
                <input
                  type="text"
                  value={alamatKantin}
                  onChange={(e) => setAlamatKantin(e.target.value)}
                  placeholder="Contoh: Jl. Rambutan, Kantin Sekolah Blok A1"
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="kantinActiveCheckbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <label htmlFor="kantinActiveCheckbox" className="text-xs font-bold text-gray-700">
                  Kantin Sedang Beroperasi (Aktif)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-floating"
                >
                  Simpan Kantin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
