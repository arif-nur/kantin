"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Utensils,
  Coffee,
  Pizza,
  LayoutGrid,
  AlertCircle,
  Star,
  Clock,
  ShieldCheck,
  Store,
  Tag,
  CheckCircle2,
  TrendingUp,
  QrCode,
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
  const [priceFilter, setPriceFilter] = useState<"semua" | "dibawah15rb" | "tersedia">("semua");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addItem, items } = useCart();

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
    } else {
      setToastMessage(`${menu.namaMenu} ditambahkan ke keranjang`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Popular menus for spotlight
  const popularMenus = React.useMemo(() => {
    return menuList.slice(0, 5);
  }, [menuList]);

  // Dynamically compute categories with counts from actual menu database
  const categories = React.useMemo(() => {
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
      else if (
        lower.includes("minum") ||
        lower.includes("es") ||
        lower.includes("teh") ||
        lower.includes("jus")
      )
        icon = Coffee;
      else if (lower.includes("kopi")) icon = Coffee;
      else if (
        lower.includes("snack") ||
        lower.includes("cemil") ||
        lower.includes("roti") ||
        lower.includes("kue") ||
        lower.includes("kentang") ||
        lower.includes("dimsum")
      )
        icon = Pizza;
      else icon = Star;
      result.push({ name: cat, icon, count: catCounts[cat] });
    });
    return result;
  }, [menuList]);

  const filteredMenu = menuList.filter((item) => {
    const matchesSearch =
      item.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || item.kategori.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPrice =
      priceFilter === "dibawah15rb" ? item.hargaMenu <= 15000 : true;
    const matchesStock =
      priceFilter === "tersedia" ? item.isAvailable && item.stok > 0 : true;

    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1b432a] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <StudentHeader
        kantinList={kantinList}
        selectedKantinId={selectedKantinId}
        onSelectKantin={handleSelectKantin}
      />

      <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Operational Status Banner if Closed */}
        {!loading && !operationalStatus.isOpen && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs animate-fade-in">
            <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                Kantin Sedang Tutup ({settings?.jamBuka || "07:00"} - {settings?.jamTutup || "15:00"})
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                {settings?.pesanTutup || operationalStatus.reason || "Kantin saat ini sedang tidak menerima pesanan baru."}
              </p>
            </div>
          </div>
        )}

        {/* Canteen Info Card (Clean Solid Flat Card - No Gradient, No Emojis) */}
        <div className="bg-[#1b432a] text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {kantinList.find((k) => k.id === selectedKantinId)?.namaKantin || "Wana Caffe"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Buka
                  </span>
                </div>
                <p className="text-xs text-emerald-100/70 mt-0.5 font-medium">
                  Layanan pemesanan makanan dan minuman online sekolah
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 text-xs text-emerald-100/90 font-medium">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span>{settings?.jamBuka || "07:00"} - {settings?.jamTutup || "15:00"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                <span>QRIS & Tunai</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Higienis & Halal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari makanan, minuman, atau cemilan..."
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1b432a] focus:border-transparent text-gray-900 placeholder:text-gray-400 transition shadow-xs"
          />
        </div>

        {/* Quick Filter Chips (Lucide Icons, Solid Colors, No Emojis) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 text-xs font-semibold">
          <button
            onClick={() => setPriceFilter("semua")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              priceFilter === "semua"
                ? "bg-[#1b432a] text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Semua Menu</span>
          </button>
          <button
            onClick={() => setPriceFilter("dibawah15rb")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              priceFilter === "dibawah15rb"
                ? "bg-[#1b432a] text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Harga Di Bawah 15rb</span>
          </button>
          <button
            onClick={() => setPriceFilter("tersedia")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              priceFilter === "tersedia"
                ? "bg-[#1b432a] text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Stok Tersedia</span>
          </button>
        </div>

        {/* Popular Menus Spotlight Carousel (Solid Cards, Lucide Icons, No Emojis) */}
        {menuList.length > 0 && selectedCategory === "Semua" && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#1b432a] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Menu Terlaris
                </h3>
              </div>
              <span className="text-xs font-semibold text-gray-500">Paling Sering Dipesan</span>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {popularMenus.map((menu) => {
                const inCart = items.find((i) => i.menu.id === menu.id);
                return (
                  <div
                    key={`popular-${menu.id}`}
                    className="w-56 sm:w-64 flex-shrink-0 bg-white rounded-2xl p-3 border border-gray-200 hover:border-gray-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-32 rounded-xl overflow-hidden relative mb-2.5 bg-gray-100">
                        <Image
                          src={menu.gambarUrl}
                          alt={menu.namaMenu}
                          fill
                          sizes="256px"
                          className="object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1b432a] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <TrendingUp className="w-3 h-3 text-emerald-300" />
                          <span>Terlaris</span>
                        </span>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-white text-gray-900 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <Link href={`/menu/${menu.id}`}>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#1b432a] transition truncate">
                          {menu.namaMenu}
                        </h4>
                      </Link>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {menu.deskripsi}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="font-bold text-sm text-[#1b432a]">
                        {formatRupiah(menu.hargaMenu)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(menu)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                          inCart
                            ? "bg-[#1b432a] text-white shadow-xs"
                            : "bg-emerald-50 text-[#1b432a] hover:bg-[#1b432a] hover:text-white"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `${inCart.quantity} di Keranjang` : "Pesan"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Pills (Lucide Icons, Solid Colors, No Emojis) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Kategori Menu</h2>
            <span className="text-xs font-semibold text-gray-500">
              {filteredMenu.length} Pilihan Tersedia
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition ${
                    isActive
                      ? "bg-[#1b432a] text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">
              {selectedCategory === "Semua" ? "Daftar Menu" : selectedCategory}
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse h-36"
                />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 my-6">
              <div className="w-14 h-14 mx-auto rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">Menu Tidak Ditemukan</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Coba gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((menu) => {
                const inCart = items.find((i) => i.menu.id === menu.id);
                const isOutOfStock = menu.stok <= 0 || !menu.isAvailable;

                return (
                  <div
                    key={menu.id}
                    className="bg-white rounded-2xl p-3.5 border border-gray-200 hover:border-gray-300 transition-all flex gap-3.5 relative overflow-hidden group"
                  >
                    {/* Image Thumbnail */}
                    <Link
                      href={`/menu/${menu.id}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100"
                    >
                      <Image
                        src={menu.gambarUrl}
                        alt={menu.namaMenu}
                        fill
                        sizes="(max-width: 640px) 96px, 112px"
                        className="object-cover"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Habis
                          </span>
                        </div>
                      )}
                      {!isOutOfStock && menu.stok <= 5 && (
                        <span className="absolute top-1 left-1 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Sisa {menu.stok}
                        </span>
                      )}
                    </Link>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {menu.kodeMenu} • {menu.kategori}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>4.9</span>
                          </div>
                        </div>

                        <Link href={`/menu/${menu.id}`}>
                          <h4 className="font-bold text-sm sm:text-base text-gray-900 hover:text-[#1b432a] transition truncate">
                            {menu.namaMenu}
                          </h4>
                        </Link>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {menu.deskripsi}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                        <span className="text-sm sm:text-base font-bold text-[#1b432a]">
                          {formatRupiah(menu.hargaMenu)}
                        </span>

                        <button
                          onClick={() => handleAddToCart(menu)}
                          disabled={isOutOfStock}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                            isOutOfStock
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : inCart
                              ? "bg-[#1b432a] text-white shadow-xs"
                              : "bg-emerald-50 text-[#1b432a] hover:bg-[#1b432a] hover:text-white"
                          }`}
                          title={isOutOfStock ? "Stok habis" : "Tambah ke keranjang"}
                        >
                          {inCart ? (
                            <span className="text-xs font-bold">{inCart.quantity}</span>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Basket & Bottom Nav */}
      <FloatingBasket />
      <StudentBottomNav />
    </div>
  );
}
