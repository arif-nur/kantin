"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  ArrowRight,
  Lock,
  Edit3,
  Tag,
  CheckCircle2,
  X,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { formatRupiah } from "@/lib/utils";
import { AVAILABLE_VOUCHERS } from "@/lib/voucher-service";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";

export default function KeranjangPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    updateItemNote,
    clearCart,
    subtotal,
    totalPrice,
    totalItems,
    currentKantinNama,
    appliedVoucher,
    voucherDiscount,
    applyVoucher,
    removeVoucher,
  } = useCart();
  const { userProfile } = useAuth();
  const [voucherInput, setVoucherInput] = useState("");

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    const res = applyVoucher(voucherInput.trim());
    if (res.success) {
      setVoucherInput("");
    }
  };

  const handleProceedCheckout = () => {
    if (!userProfile) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-36">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/70 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="text-sm sm:text-base font-extrabold text-gray-900">
          Keranjang Pesanan ({totalItems})
        </h1>

        {items.length > 0 ? (
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
          >
            Hapus Semua
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-3.5">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 my-6 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#16a34a] flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Keranjangmu Masih Kosong</h2>
            <p className="text-xs text-gray-500 mt-1 mb-5 max-w-xs mx-auto">
              Yuk lihat menu makanan dan minuman lezat di kantin kampus!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition shadow-xs"
            >
              Lihat Menu Kantin
            </Link>
          </div>
        ) : (
          <>
            {/* Canteen Header Info */}
            <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16a34a] flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Pesanan Dari</span>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {currentKantinNama || "Kantin Kampus"}
                </p>
              </div>
              <Link href="/menu" className="text-xs font-bold text-[#16a34a] hover:underline whitespace-nowrap">
                + Tambah Menu
              </Link>
            </div>

            {/* Auth Notification if guest */}
            {!userProfile && (
              <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium min-w-0">
                  <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span className="truncate text-[11px]">Masuk akun untuk melanjutkan checkout.</span>
                </div>
                <Link
                  href="/login?redirect=/checkout"
                  className="text-amber-900 font-bold hover:underline flex-shrink-0 text-xs"
                >
                  Masuk
                </Link>
              </div>
            )}

            {/* Cart Items List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {items.map(({ menu, quantity, catatanItem }) => (
                <div key={menu.id} className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                        {menu.namaMenu}
                      </h3>
                      <p className="text-xs font-extrabold text-[#16a34a] mt-0.5">
                        {formatRupiah(menu.hargaMenu)}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100">
                      <Image
                        src={menu.gambarUrl}
                        alt={menu.namaMenu}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Item Note Input */}
                    <div className="flex-1 max-w-[200px] sm:max-w-xs">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Edit3 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={catatanItem || ""}
                          onChange={(e) => updateItemNote(menu.id, e.target.value)}
                          placeholder="Catatan (cth: pedas, kuah pisah)..."
                          className="w-full text-[11px] bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
                      <button
                        onClick={() => updateQuantity(menu.id, quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition"
                        title="Kurang"
                      >
                        {quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-red-500" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(menu.id, quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-[#16a34a] text-white rounded-lg transition"
                        title="Tambah"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher & Promo Code Section */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#16a34a]" />
                  Voucher & Kupon Promo
                </span>
                {appliedVoucher && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    1 Kupon Terpasang
                  </span>
                )}
              </div>

              {/* Active Voucher Display */}
              {appliedVoucher ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                    <div>
                      <span className="text-xs font-black text-gray-900">{appliedVoucher.kode}</span>
                      <p className="text-[11px] text-emerald-800">
                        Hemat {formatRupiah(voucherDiscount)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                    title="Hapus voucher"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Voucher Input Form */
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode kupon (cth: JUMATBERKAH)"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#16a34a] uppercase"
                  />
                  <button
                    type="submit"
                    disabled={!voucherInput.trim()}
                    className="px-4 py-2 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 transition"
                  >
                    Terapkan
                  </button>
                </form>
              )}

              {/* Quick Voucher Chips */}
              {!appliedVoucher && (
                <div className="pt-1">
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase">Kupon Tersedia:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_VOUCHERS.map((v) => (
                      <button
                        key={v.kode}
                        type="button"
                        onClick={() => applyVoucher(v.kode)}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-emerald-50 hover:text-[#16a34a] border border-gray-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold text-gray-600 transition"
                      >
                        {v.kode} (-{v.tipe === "nominal" ? formatRupiah(v.nilai) : `${v.nilai}%`})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
              <h3 className="font-bold text-gray-900">
                Ringkasan Pembayaran
              </h3>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItems} item)</span>
                <span className="font-bold text-gray-900">{formatRupiah(subtotal)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-[#16a34a] font-bold">
                  <span>Diskon Voucher ({appliedVoucher?.kode})</span>
                  <span>-{formatRupiah(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan</span>
                <span className="font-bold text-[#16a34a]">GRATIS</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900">Total Harga</span>
                <span className="text-base font-extrabold text-[#16a34a]">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <aside aria-label="Aksi Checkout Pesanan" className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-3 shadow-lg">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-gray-400 font-semibold leading-tight">Total Pembayaran</div>
              <div className="text-base font-extrabold text-[#16a34a]">
                {formatRupiah(totalPrice)}
              </div>
            </div>

            <button
              onClick={handleProceedCheckout}
              className="py-2.5 px-5 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-2 active:scale-98"
            >
              <span>{userProfile ? "Lanjut Pembayaran" : "Masuk & Bayar"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      <StudentBottomNav />
    </div>
  );
}
