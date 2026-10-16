"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Utensils,
  Coffee,
  Pizza,
  LayoutGrid,
  Clock,
  Store,
  ChevronDown,
  X,
  CheckCircle2,
  Sparkles,
  Star,
} from "lucide-react";
import StudentHeader from "@/components/navigation/StudentHeader";
import FloatingBasket from "@/components/navigation/FloatingBasket";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";
import { useCart } from "@/lib/context/CartContext";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem, KantinSettings } from "@/types";
import { formatRupiah, isKantinOperational } from "@/lib/utils";

export default function MenuPage() {
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [selectedKantinId, setSelectedKantinId] = useState<string>("");
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<KantinSettings | null>(null);
  const [operationalStatus, setOperationalStatus] = useState<{ isOpen: boolean; reason?: string }>({ isOpen: true });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addItem, updateQuantity, items } = useCart();

  useEffect(() => {
    async function loadData() {
      await DataService.initIfEmpty();
      const [kList, s] = await Promise.all([
        DataService.getKantinList(),
        DataService.getSettings(),
      ]);
      setKantinList(kList);
      setSettings(s);
      setOperationalStatus(isKantinOperational(s.jamBuka, s.jamTutup, s.isStoreOpenManual));

      if (kList.length > 0) {
        setSelectedKantinId(kList[0].id);
        const mList = await DataService.getMenuList(kList[0].id);
        setMenuList(mList);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSelectKantin = async (id: string) => {
    setSelectedKantinId(id);
    setLoading(true);
    const mList = await DataService.getMenuList(id);
    setMenuList(mList);
    setLoading(false);
  };

  const handleAddToCart = (menu: MenuItem) => {
    if (!operationalStatus.isOpen) {
      setToastMessage(operationalStatus.reason || "Kantin sedang tutup saat ini.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const kantin = kantinList.find((k) => k.id === menu.kantinId);
    const res = addItem(menu, kantin?.namaKantin);
    if (!res.success && res.message) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const currentKantin = useMemo(() => {
    return kantinList.find((k) => k.id === selectedKantinId) || kantinList[0];
  }, [kantinList, selectedKantinId]);

  // Dynamically compute categories
  const categories = useMemo(() => {
    const catCounts: Record<string, number> = {};
    menuList.forEach((m) => {
      const cat = m.kategori ? m.kategori.trim() : "Lainnya";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const result = [{ name: "Semua", icon: LayoutGrid, count: menuList.length }];
    Object.keys(catCounts).forEach((cat) => {
      const lower = cat.toLowerCase();
      let icon = LayoutGrid;
      if (lower.includes("makan")) icon = Utensils;
      else if (lower.includes("minum") || lower.includes("es") || lower.includes("teh") || lower.includes("jus")) icon = Coffee;
      else if (lower.includes("kopi")) icon = Coffee;
      else if (lower.includes("snack") || lower.includes("cemil") || lower.includes("roti") || lower.includes("kue")) icon = Pizza;
      result.push({ name: cat, icon, count: catCounts[cat] });
    });
    return result;
  }, [menuList]);

  // Filter menu list
  const filteredMenu = useMemo(() => {
    return menuList.filter((item) => {
      const matchesSearch =
        item.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "Semua" || item.kategori.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [menuList, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-32">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-gray-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Student Header */}
      <StudentHeader
        kantinList={kantinList}
        selectedKantinId={selectedKantinId}
        onSelectKantin={handleSelectKantin}
      />

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Merchant Profile Banner (GoFood / GrabFood Merchant Style) */}
        <section aria-label="Informasi Merchant Kantin" className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-[#16a34a] border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Store className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                    {currentKantin?.namaKantin || "Kantin Kampus"}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      operationalStatus.isOpen
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        operationalStatus.isOpen ? "bg-emerald-600 animate-pulse" : "bg-red-500"
                      }`}
                    />
                    {operationalStatus.isOpen ? "Buka Sekarang" : "Tutup"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {currentKantin?.alamatKantin || "Area Kantin Utama Kampus"}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mt-2">
                  <span className="flex items-center gap-1 text-gray-600 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {settings?.jamBuka || "07:00"} - {settings?.jamTutup || "15:00"}
                  </span>
                  <span>•</span>
                  <span>Bayar KantinPay, QRIS & Tunai</span>
                  <span>•</span>
                  <span>Higienis</span>
                </div>
              </div>
            </div>

            {/* Operational notice when closed */}
            {!operationalStatus.isOpen && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 sm:max-w-xs">
                <p className="font-bold">Kantin sedang tidak menerima pesanan.</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {settings?.pesanTutup || operationalStatus.reason || "Buka kembali jam operasional berikutnya."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari menu di ${currentKantin?.namaKantin || "kantin"}...`}
            className="w-full pl-10 pr-9 py-3 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent text-gray-900 placeholder:text-gray-400 transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sticky Category Tabs Navigation (GoFood / GrabFood Style) */}
        <div className="sticky top-16 z-20 bg-[#f8faf8]/95 backdrop-blur-md py-2 -mx-4 px-4 border-b border-gray-200/60">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#16a34a] text-white shadow-xs"
                      : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Section */}
        <section aria-label="Daftar Menu Makanan dan Minuman" className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
              {selectedCategory === "Semua" ? "Semua Menu" : selectedCategory}
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {filteredMenu.length} menu
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl p-4 border border-gray-100 h-28 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 my-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Menu Tidak Ditemukan</h3>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery
                  ? `Tidak ada hasil pencarian "${searchQuery}". Coba kata kunci lain.`
                  : "Belum ada menu di kategori ini."}
              </p>
            </div>
          ) : (
            /* Modern 2-Column Food Delivery Menu Card Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              {filteredMenu.map((menu) => {
                const inCart = items.find((i) => i.menu.id === menu.id);
                const isOutOfStock = menu.stok <= 0 || !menu.isAvailable;

                return (
                  <div
                    key={menu.id}
                    className="bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-gray-200 hover:shadow-xs transition flex gap-3 justify-between items-start group"
                  >
                    {/* Left: Info & Price */}
                    <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch">
                      <div>
                        <Link href={`/menu/${menu.id}`} className="block">
                          <h3 className="font-bold text-sm sm:text-[15px] text-gray-900 group-hover:text-[#16a34a] transition line-clamp-1">
                            {menu.namaMenu}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {menu.deskripsi}
                        </p>
                      </div>

                      <div className="mt-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-sm sm:text-base text-gray-900">
                            {formatRupiah(menu.hargaMenu)}
                          </span>
                          {menu.ratingRataRata ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {menu.ratingRataRata.toFixed(1)}
                              {menu.totalUlasan ? (
                                <span className="text-gray-400 font-normal">({menu.totalUlasan})</span>
                              ) : null}
                            </span>
                          ) : null}
                          {!isOutOfStock && menu.stok <= 5 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              Sisa {menu.stok}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Square Photo + Add / Quantity Stepper Button */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <Link
                        href={`/menu/${menu.id}`}
                        className="w-24 h-24 sm:w-26 sm:h-26 rounded-xl overflow-hidden relative bg-gray-100 block"
                      >
                        <Image
                          src={menu.gambarUrl}
                          alt={menu.namaMenu}
                          fill
                          sizes="(max-width: 640px) 96px, 104px"
                          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isOutOfStock ? "grayscale opacity-60" : ""
                          }`}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-white bg-red-600 px-2 py-0.5 rounded-md">
                              Habis
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Add Button or Stepper (GoFood Style) */}
                      <div className="mt-2 w-full flex justify-center">
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-full py-1 px-3 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
                          >
                            Habis
                          </button>
                        ) : inCart ? (
                          /* Interactive Stepper when in cart */
                          <div className="flex items-center bg-emerald-50 rounded-xl border border-emerald-200 p-0.5 shadow-2xs">
                            <button
                              onClick={() => updateQuantity(menu.id, inCart.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 rounded-lg transition active:scale-90"
                              title="Kurangi kuantitas"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-extrabold text-xs text-emerald-950">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => {
                                if (inCart.quantity < menu.stok) {
                                  updateQuantity(menu.id, inCart.quantity + 1);
                                } else {
                                  setToastMessage(`Stok maksimal hanya ${menu.stok}`);
                                  setTimeout(() => setToastMessage(null), 2500);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-[#16a34a] text-white hover:bg-emerald-700 rounded-lg transition active:scale-90"
                              title="Tambah kuantitas"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Initial Add Button */
                          <button
                            onClick={() => handleAddToCart(menu)}
                            disabled={!operationalStatus.isOpen}
                            className={`w-full py-1 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs ${
                              !operationalStatus.isOpen
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white border border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Basket & Bottom Nav */}
      <FloatingBasket />
      <StudentBottomNav />
    </div>
  );
}
