"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Store, ChevronRight, Lock } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { formatRupiah } from "@/lib/utils";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";

import { DataService } from "@/lib/data-service";
import { MenuItem } from "@/types";

export default function KeranjangPage() {
  const router = useRouter();
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalPrice,
    totalItems,
    currentKantinId,
    currentKantinNama,
  } = useCart();
  const { userProfile } = useAuth();

  const [recommendedMenu, setRecommendedMenu] = React.useState<MenuItem[]>([]);

  const handleProceedCheckout = () => {
    if (!userProfile) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  React.useEffect(() => {
    async function loadRecommendations() {
      try {
        if (!currentKantinId) {
          const kList = await DataService.getKantinList();
          if (kList.length > 0) {
            const list = await DataService.getMenuList(kList[0].id);
            setRecommendedMenu(list.filter((m) => m.isAvailable && m.stok > 0).slice(0, 3));
          }
        } else {
          const list = await DataService.getMenuList(currentKantinId);
          const inCartIds = new Set(items.map((i) => i.menu.id));
          const filtered = list.filter((m) => !inCartIds.has(m.id) && m.isAvailable && m.stok > 0);
          setRecommendedMenu(filtered.slice(0, 3));
        }
      } catch (e) {
        console.error("Gagal memuat rekomendasi menu:", e);
      }
    }
    loadRecommendations();
  }, [currentKantinId, items]);

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-48 sm:pb-32">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-brand-600" />
          <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
            Keranjang Saya
          </h1>
        </div>

        {items.length > 0 ? (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-red-500 hover:text-red-700 p-2"
          >
            Hapus Semua
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-gray-100 mt-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-brand-600 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Keranjang Masih Kosong</h2>
            <p className="text-xs text-gray-500 mt-1 mb-6 max-w-xs mx-auto">
              Perut lapar? Jelajahi menu kantin sekolah yang lezat dan tambahkan ke keranjangmu sekarang!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1b432a] text-white font-bold text-sm rounded-2xl shadow-floating hover:bg-[#153621] transition"
            >
              Mulai Pesan Makanan
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Canteen Header Info */}
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-emerald-800">Pesanan dari Kantin:</p>
                <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                  {currentKantinNama || "Kantin Sekolah"}
                </p>
              </div>
            </div>

            {/* Auth Notification if not logged in */}
            {!userProfile && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-semibold min-w-0">
                  <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span className="truncate">Anda belum masuk ke akun pemesan.</span>
                </div>
                <Link
                  href="/login?redirect=/checkout"
                  className="text-[#1b432a] font-extrabold hover:underline flex-shrink-0"
                >
                  Masuk Akun
                </Link>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              {items.map(({ menu, quantity }) => (
                <div
                  key={menu.id}
                  className="bg-white rounded-3xl p-4 shadow-card border border-gray-100 flex items-center gap-4 transition hover:shadow-md"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative flex-shrink-0 bg-gray-100">
                    <Image
                      src={menu.gambarUrl}
                      alt={menu.namaMenu}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate">
                      {menu.namaMenu}
                    </h3>
                    <p className="text-xs font-bold text-brand-600 mt-0.5">
                      {formatRupiah(menu.hargaMenu)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Subtotal: {formatRupiah(menu.hargaMenu * quantity)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-1 border border-gray-100 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(menu.id, quantity + 1)}
                      className="w-7 h-7 rounded-xl bg-white text-gray-700 flex items-center justify-center shadow-xs hover:bg-gray-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-extrabold text-gray-900 py-1 min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(menu.id, quantity - 1)}
                      className="w-7 h-7 rounded-xl bg-white text-gray-700 flex items-center justify-center shadow-xs hover:bg-gray-100 transition"
                    >
                      {quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Food Recommendation Carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  Menu Pelengkap
                </h3>
                <Link href="/menu" className="text-xs font-bold text-brand-600 flex items-center">
                  Tambah Lainnya <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recommendedMenu.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {recommendedMenu.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-between hover:shadow-md transition"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden relative mb-1.5 bg-gray-100">
                        <Image
                          src={rec.gambarUrl}
                          alt={rec.namaMenu}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 truncate w-full">
                        {rec.namaMenu}
                      </span>
                      <span className="text-[10px] font-semibold text-brand-600 mt-0.5">
                        {formatRupiah(rec.hargaMenu)}
                      </span>
                      <button
                        onClick={() => addItem(rec, currentKantinNama || undefined)}
                        className="mt-2 text-[10px] font-extrabold px-2.5 py-1 bg-emerald-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-xl transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Ringkasan Pembayaran
              </h3>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal ({totalItems} item)</span>
                <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Biaya Layanan Kantin</span>
                <span className="font-bold text-emerald-600">GRATIS</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                <span className="text-base font-extrabold text-brand-600">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
              <div className="max-w-2xl mx-auto pointer-events-auto">
                <button
                  onClick={handleProceedCheckout}
                  className="w-full bg-[#1b432a] hover:bg-[#153621] text-white py-4 px-6 rounded-3xl font-extrabold text-sm sm:text-base flex items-center justify-between shadow-floating transition transform active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-black">
                      {userProfile ? totalItems : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    <span>{userProfile ? "Lanjut ke Pembayaran" : "Masuk untuk Checkout"}</span>
                  </div>
                  <span className="text-emerald-300 font-black">{formatRupiah(totalPrice)}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
