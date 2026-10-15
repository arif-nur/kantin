"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, Utensils, Coffee, Pizza, LayoutGrid, AlertCircle, Star } from "lucide-react";
import StudentHeader from "@/components/navigation/StudentHeader";
import FloatingBasket from "@/components/navigation/FloatingBasket";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";
import { useCart } from "@/lib/context/CartContext";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem } from "@/types";
import { formatRupiah } from "@/lib/utils";

export default function MenuPage() {
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [selectedKantinId, setSelectedKantinId] = useState<string>("");
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { addItem, items } = useCart();

  useEffect(() => {
    async function loadData() {
      await DataService.initIfEmpty();
      const kList = await DataService.getKantinList();
      setKantinList(kList);
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
    const kantin = kantinList.find((k) => k.id === menu.kantinId);
    const res = addItem(menu, kantin?.namaKantin);
    if (!res.success && res.message) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setToastMessage(`✓ ${menu.namaMenu} ditambahkan ke keranjang`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const categories = [
    { name: "Semua", icon: LayoutGrid },
    { name: "Makanan", icon: Utensils },
    { name: "Minuman", icon: Coffee },
    { name: "Snack", icon: Pizza },
  ];

  const filteredMenu = menuList.filter((item) => {
    const matchesSearch =
      item.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || item.kategori.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-gray-700">
          <AlertCircle className="w-4 h-4 text-emerald-400" />
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
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mau makan atau minum apa hari ini?"
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm placeholder:text-gray-400 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Kategori Pilihan</h2>
            <span className="text-xs font-semibold text-brand-600">
              {filteredMenu.length} Menu Tersedia
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-sm ${
                    isActive
                      ? "bg-[#1b432a] text-white shadow-emerald-900/20 shadow-md scale-[1.02]"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isActive ? "bg-white/20 text-white" : "bg-emerald-50 text-brand-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              {selectedCategory === "Semua" ? "Daftar Menu Favorit" : selectedCategory}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse h-40"
                />
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-gray-100 my-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Menu Belum Ditemukan</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Coba cari dengan kata kunci lain atau pilih kategori yang berbeda.
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
                    className="bg-white rounded-3xl p-3.5 shadow-card border border-gray-100/80 hover:shadow-md transition-all duration-200 flex gap-3.5 relative overflow-hidden group"
                  >
                    {/* Image Thumbnail */}
                    <Link
                      href={`/menu/${menu.id}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative flex-shrink-0 bg-gray-100"
                    >
                      <Image
                        src={menu.gambarUrl}
                        alt={menu.namaMenu}
                        fill
                        sizes="(max-width: 640px) 96px, 112px"
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-full">
                            Habis
                          </span>
                        </div>
                      )}
                      {!isOutOfStock && menu.stok <= 5 && (
                        <span className="absolute top-1 left-1 text-[9px] font-extrabold text-white bg-amber-500/90 px-1.5 py-0.5 rounded-md shadow-sm">
                          Sisa {menu.stok}
                        </span>
                      )}
                    </Link>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {menu.kodeMenu} • {menu.kategori}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>4.9</span>
                          </div>
                        </div>

                        <Link href={`/menu/${menu.id}`}>
                          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 group-hover:text-brand-600 transition truncate">
                            {menu.namaMenu}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {menu.deskripsi}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-50">
                        <span className="text-sm sm:text-base font-extrabold text-brand-600">
                          {formatRupiah(menu.hargaMenu)}
                        </span>

                        <button
                          onClick={() => handleAddToCart(menu)}
                          disabled={isOutOfStock}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                            isOutOfStock
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : inCart
                              ? "bg-brand-600 text-white shadow-brand-500/30 scale-105"
                              : "bg-emerald-50 text-brand-700 hover:bg-brand-600 hover:text-white"
                          }`}
                          title={isOutOfStock ? "Stok habis" : "Tambah ke keranjang"}
                        >
                          {inCart ? (
                            <span className="text-xs font-black">{inCart.quantity}</span>
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
