"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UploadCloud,
  Check,
  X,
  AlertCircle,
  Eye,
  CheckCircle2,
  DollarSign,
  Package,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem } from "@/types";
import { formatRupiah } from "@/lib/utils";

export default function AdminMenuPage() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [selectedKantinId, setSelectedKantinId] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  // Form State
  const [kodeMenu, setKodeMenu] = useState("");
  const [namaMenu, setNamaMenu] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("Makanan");
  const [hargaMenu, setHargaMenu] = useState<number>(15000);
  const [stok, setStok] = useState<number>(10);
  const [kantinId, setKantinId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [gambarUrl, setGambarUrl] = useState("");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    await DataService.initIfEmpty();
    const [m, k] = await Promise.all([
      DataService.getMenuList(),
      DataService.getKantinList(),
    ]);
    setMenuList(m);
    setKantinList(k);
    if (k.length > 0 && !kantinId) {
      setKantinId(k[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    const nextSeq = menuList.length + 1;
    setKodeMenu(`A${String(nextSeq).padStart(3, "0")}`);
    setNamaMenu("");
    setDeskripsi("");
    setKategori("Makanan");
    setHargaMenu(15000);
    setStok(15);
    setKantinId(kantinList[0]?.id || "kantin-barokah-01");
    setIsAvailable(true);
    setGambarUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80");
    setCloudinaryPublicId("");
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setKodeMenu(menu.kodeMenu);
    setNamaMenu(menu.namaMenu);
    setDeskripsi(menu.deskripsi);
    setKategori(menu.kategori);
    setHargaMenu(menu.hargaMenu);
    setStok(menu.stok);
    setKantinId(menu.kantinId);
    setIsAvailable(menu.isAvailable);
    setGambarUrl(menu.gambarUrl);
    setCloudinaryPublicId(menu.cloudinaryPublicId || "");
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Hanya file format JPEG, PNG, atau WebP yang diperbolehkan.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran gambar melebihi batas maksimal 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Request signed params from server without exposing API Secret
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", folder: "kantin-sekolah/menu" }),
      });
      const signData = await signRes.json();

      if (!signRes.ok || !signData.signature) {
        // Fallback for local preview if Cloudinary credentials are mock
        const localPreviewUrl = URL.createObjectURL(file);
        setGambarUrl(localPreviewUrl);
        setUploading(false);
        return;
      }

      // 2. Direct upload to Cloudinary using signed signature
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();
      if (cloudData.secure_url) {
        setGambarUrl(cloudData.secure_url);
        setCloudinaryPublicId(cloudData.public_id);
      } else {
        throw new Error(cloudData.error?.message || "Upload gagal");
      }
    } catch (err: any) {
      console.warn("Upload fallback", err);
      // Create local blob preview
      setGambarUrl(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMenu || !hargaMenu || stok < 0) return;

    const payload = {
      kodeMenu,
      namaMenu,
      deskripsi,
      kategori,
      hargaMenu: Number(hargaMenu),
      stok: Number(stok),
      kantinId,
      isAvailable,
      gambarUrl: gambarUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      cloudinaryPublicId,
    };

    if (editingMenu) {
      await DataService.updateMenu(editingMenu.id, payload);
    } else {
      await DataService.createMenu(payload);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string, publicId?: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      await DataService.deleteMenu(id, publicId);
      loadData();
    }
  };

  const filtered = menuList.filter((m) => {
    const matchesSearch =
      m.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.kodeMenu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKantin = selectedKantinId === "semua" || m.kantinId === selectedKantinId;
    return matchesSearch && matchesKantin;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Manajemen Menu Kantin
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Tambah, perbarui harga, stok, dan gambar menu makanan & minuman
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-floating transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau nama menu..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter Kantin:</span>
            <select
              value={selectedKantinId}
              onChange={(e) => setSelectedKantinId(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-auto"
            >
              <option value="semua">Semua Kantin</option>
              {kantinList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKantin}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Gambar</th>
                  <th className="py-3.5 px-4 font-extrabold">Kode</th>
                  <th className="py-3.5 px-4 font-extrabold">Nama Menu</th>
                  <th className="py-3.5 px-4 font-extrabold">Kategori</th>
                  <th className="py-3.5 px-4 font-extrabold">Harga</th>
                  <th className="py-3.5 px-4 font-extrabold">Stok</th>
                  <th className="py-3.5 px-4 font-extrabold">Kantin</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      Memuat data menu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      Belum ada menu yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((menu) => {
                    const kantinName =
                      kantinList.find((k) => k.id === menu.kantinId)?.namaKantin || "Kantin";

                    return (
                      <tr key={menu.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-gray-100 shadow-xs">
                            <Image
                              src={menu.gambarUrl}
                              alt={menu.namaMenu}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-gray-900">{menu.kodeMenu}</td>
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-gray-900">{menu.namaMenu}</p>
                          <p className="text-[11px] text-gray-400 line-clamp-1 max-w-xs">
                            {menu.deskripsi}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{menu.kategori}</td>
                        <td className="py-3 px-4 font-extrabold text-brand-700">
                          {formatRupiah(menu.hargaMenu)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                              menu.stok <= 3
                                ? "bg-red-100 text-red-700"
                                : menu.stok <= 5
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-brand-800"
                            }`}
                          >
                            {menu.stok}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">{kantinName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              menu.isAvailable
                                ? "bg-emerald-100 text-brand-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {menu.isAvailable ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal(menu)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            title="Edit Menu"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id, menu.cloudinaryPublicId)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Menu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingMenu ? `Edit Menu (${editingMenu.kodeMenu})` : "Tambah Menu Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Image Upload with Cloudinary Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Gambar Menu (Cloudinary)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-gray-100 border border-gray-200 flex-shrink-0">
                    {gambarUrl ? (
                      <Image src={gambarUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploading ? "Mengunggah..." : "Pilih File Gambar (Maks 5MB)"}</span>
                    </button>
                    <p className="text-[10px] text-gray-400">
                      Format: JPEG, PNG, atau WebP. Gambar langsung dioptimalkan Cloudinary.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Menu</label>
                  <input
                    type="text"
                    value={kodeMenu}
                    onChange={(e) => setKodeMenu(e.target.value)}
                    placeholder="Contoh: A001"
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  value={namaMenu}
                  onChange={(e) => setNamaMenu(e.target.value)}
                  placeholder="Contoh: Nasi Ayam Bakar Spesial"
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={2}
                  placeholder="Penjelasan porsi dan bahan makanan..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={hargaMenu}
                    onChange={(e) => setHargaMenu(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    value={stok}
                    onChange={(e) => setStok(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kantin</label>
                  <select
                    value={kantinId}
                    onChange={(e) => setKantinId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    {kantinList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKantin}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isAvailableCheckbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                  <label htmlFor="isAvailableCheckbox" className="text-xs font-bold text-gray-700">
                    Menu Tersedia (Aktif)
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-floating disabled:opacity-50"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
