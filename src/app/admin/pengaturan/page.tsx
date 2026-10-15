"use client";

import React, { useState } from "react";
import {
  Settings,
  Database,
  Cloud,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Save,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";

export default function AdminPengaturanPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [jamBuka, setJamBuka] = useState("07:00");
  const [jamTutup, setJamTutup] = useState("15:00");
  const [isStoreOpenManual, setIsStoreOpenManual] = useState(true);
  const [pesanTutup, setPesanTutup] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      const s = await DataService.getSettings();
      setJamBuka(s.jamBuka || "07:00");
      setJamTutup(s.jamTutup || "15:00");
      setIsStoreOpenManual(s.isStoreOpenManual !== false);
      setPesanTutup(s.pesanTutup || "Kantin sedang tutup. Silakan kembali saat jam operasional.");
    }
    loadSettings();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      // Re-init local storage
      localStorage.removeItem("kantin_data_initialized");
      await DataService.initIfEmpty();

      setSeedResult("✓ Data awal (Excel & referensi) berhasil diinisialisasi ke database!");
    } catch (err: any) {
      setSeedResult("Gagal seed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await DataService.updateSettings({
        jamBuka,
        jamTutup,
        isStoreOpenManual,
        pesanTutup,
      });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 3000);
    } catch (err: any) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearPWACache = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      alert("Cache PWA berhasil dibersihkan.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Pengaturan Sistem Kantin
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Konfigurasi jam operasional, status integrasi Firebase & Cloudinary, dan inisialisasi database
          </p>
        </div>

        {/* Database Seeding Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Inisialisasi Data Awal (Seed Data)
              </h3>
              <p className="text-xs text-gray-500">
                Isi database dengan data contoh sesuai referensi: Barokah Food, Nasi Ayam Bakar, Mie Ayam, Es Teh, Es Jeruk, dan Mahasiswa (Arief, Siti, Budi, Ardhians).
              </p>
            </div>
          </div>

          {seedResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{seedResult}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-floating transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
              <span>{seeding ? "Menginisialisasi Data..." : "Inisialisasi Data Awal Sekarang"}</span>
            </button>
          </div>
        </div>

        {/* Operational Hours Form */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
            Jam Buka & Operasional Kantin
          </h3>

          {savedSettings && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan jam operasional berhasil disimpan.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jam Buka Pelayanan
                </label>
                <input
                  type="time"
                  value={jamBuka}
                  onChange={(e) => setJamBuka(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jam Tutup Pelayanan
                </label>
                <input
                  type="time"
                  value={jamTutup}
                  onChange={(e) => setJamTutup(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStoreOpenManual}
                  onChange={(e) => setIsStoreOpenManual(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-gray-800">
                  Kantin Sedang Buka / Menerima Pesanan
                </span>
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5 ml-6">
                Hapus centang jika kantin ingin diliburkan atau ditutup mendadak.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pesan Notifikasi Saat Kantin Tutup
              </label>
              <input
                type="text"
                value={pesanTutup}
                onChange={(e) => setPesanTutup(e.target.value)}
                placeholder="Contoh: Kantin sedang tutup. Silakan kembali saat jam istirahat."
                className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-[#082215] text-emerald-400 font-extrabold text-xs rounded-xl hover:bg-[#05170e] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? "Menyimpan..." : "Simpan Pengaturan Operasional"}</span>
            </button>
          </form>
        </div>

        {/* PWA & Cache Maintenance */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                PWA (Progressive Web App) Cache
              </h3>
              <p className="text-xs text-gray-500">
                Bersihkan cache service worker pada perangkat jika menu statis tidak segera terbarui.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClearPWACache}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
            >
              Bersihkan Cache PWA
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
