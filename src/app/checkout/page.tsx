"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Store,
  Info,
  Lock,
} from "lucide-react";
import QRCode from "qrcode";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { DataService } from "@/lib/data-service";
import { formatRupiah, isKantinOperational } from "@/lib/utils";

function buildDynamicQrisPayload(canteenName: string, amount: number): string {
  const cleanName = (canteenName || "KANTIN SEKOLAH").toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 22);
  const nameLen = String(cleanName.length).padStart(2, "0");
  const amountStr = String(amount);
  const amountLen = String(amountStr.length).padStart(2, "0");
  const refCode = `TRX${Date.now().toString().slice(-4)}`;

  return `00020101021226670014ID.LINKAJA.WWW011893600914000000000002150000000000000000303UMI51440014ID.CO.QRIS.WWW0215ID102002123456752045812530336054${amountLen}${amountStr}5802ID59${nameLen}${cleanName}6007JAKARTA62070703${refCode}6304`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, currentKantinId, currentKantinNama, totalPrice, clearCart } = useCart();
  const { userProfile, loading: authLoading } = useAuth();

  const [metodeTransaksi, setMetodeTransaksi] = useState<"QRIS" | "tunai">("QRIS");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrisQrCodeUrl, setQrisQrCodeUrl] = useState<string>("");

  // Generate QR Code data URL dynamically for current canteen & amount
  useEffect(() => {
    async function makeQR() {
      try {
        const dynamicPayload = buildDynamicQrisPayload(currentKantinNama || "Kantin Sekolah", totalPrice);
        const url = await QRCode.toDataURL(dynamicPayload, {
          margin: 1,
          width: 260,
          color: {
            dark: "#0b2b1a",
            light: "#ffffff",
          },
        });
        setQrisQrCodeUrl(url);
      } catch (e) {
        console.error("QR Code generate error", e);
      }
    }
    if (totalPrice > 0) {
      makeQR();
    }
  }, [totalPrice, currentKantinNama]);

  // Auth Guard: Enforce login before checkout
  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.replace("/login?redirect=/checkout");
    }
  }, [userProfile, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1b432a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Memverifikasi status akun Anda...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-gray-100 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b432a] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Masuk untuk Melanjutkan Pesanan
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Anda harus masuk ke akun pemesan terlebih dahulu agar pesanan dapat tercatat atas nama Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/login?redirect=/checkout"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#1b432a] text-white font-bold rounded-2xl text-xs hover:bg-[#153621] transition shadow-xs"
            >
              <User className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-gray-100">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Keranjang Kosong</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            Anda belum memilih menu untuk dicheckout.
          </p>
          <Link
            href="/menu"
            className="block py-3 px-4 bg-brand-600 text-white font-bold rounded-2xl text-xs hover:bg-brand-700 transition"
          >
            Pilih Menu Sekarang
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (submitting) return;

    if (!userProfile) {
      router.push("/login?redirect=/checkout");
      return;
    }
    const currentProfile = userProfile;

    setSubmitting(true);
    setErrorMessage(null);

    // Validate operational hours before placing order
    try {
      const settings = await DataService.getSettings();
      const op = isKantinOperational(settings.jamBuka, settings.jamTutup, settings.isStoreOpenManual);
      if (!op.isOpen) {
        setErrorMessage(settings.pesanTutup || op.reason || "Kantin sedang tutup saat ini.");
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // Continue if offline
    }

    try {
      const result = await DataService.checkout({
        pemesanId: currentProfile.uid,
        namaPemesan: currentProfile.namaPemesan,
        kantinId: currentKantinId || "kantin-barokah-01",
        namaKantin: currentKantinNama || "Barokah Food",
        metodeTransaksi,
        catatan,
        items,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Gagal memproses pesanan.");
        setSubmitting(false);
        return;
      }

      // Success! Clear cart and redirect to order tracking
      clearCart();
      router.push(`/pesanan-saya/${result.orderId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat checkout.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
          Konfirmasi & Pembayaran
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer Info Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              Data Pemesan
            </h3>
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
              {userProfile.kodePemesan || "PEMESAN"}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-gray-900">
              {userProfile.namaPemesan}
            </p>
            <p className="text-xs text-gray-500">
              {userProfile.email}
              {userProfile.alamatPemesan ? ` • ${userProfile.alamatPemesan}` : ""}
            </p>
          </div>
        </div>

        {/* Canteen & Items Snapshot */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Kantin Tujuan</p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {currentKantinNama || "Barokah Food"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map(({ menu, quantity }) => (
              <div key={menu.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-brand-600 bg-brand-50 w-6 h-6 rounded-lg flex items-center justify-center text-[11px]">
                    {quantity}x
                  </span>
                  <span className="font-bold text-gray-800">{menu.namaMenu}</span>
                </div>
                <span className="font-semibold text-gray-700">
                  {formatRupiah(menu.hargaMenu * quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Notes input */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Catatan Pesanan (opsional):
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Sambal dipisah ya bu, kuah banyakin"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Pilih Metode Pembayaran
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* QRIS Option */}
            <button
              onClick={() => setMetodeTransaksi("QRIS")}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                metodeTransaksi === "QRIS"
                  ? "border-brand-600 bg-emerald-50/70 shadow-sm ring-2 ring-brand-500/20"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <QrCode
                  className={`w-6 h-6 ${
                    metodeTransaksi === "QRIS" ? "text-brand-700" : "text-gray-500"
                  }`}
                />
                <span className="text-[10px] font-black uppercase text-brand-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  Instan
                </span>
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">QRIS Standar</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  BCA, Gopay, OVO, Dana, ShopeePay
                </p>
              </div>
            </button>

            {/* Tunai Option */}
            <button
              onClick={() => setMetodeTransaksi("tunai")}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                metodeTransaksi === "tunai"
                  ? "border-brand-600 bg-emerald-50/70 shadow-sm ring-2 ring-brand-500/20"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Banknote
                  className={`w-6 h-6 ${
                    metodeTransaksi === "tunai" ? "text-brand-700" : "text-gray-500"
                  }`}
                />
                <span className="text-[10px] font-black uppercase text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  Kasir
                </span>
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">Bayar Tunai</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Bayar langsung ke kasir kantin saat mengambil
                </p>
              </div>
            </button>
          </div>

          {/* QRIS Instructions Box */}
          {metodeTransaksi === "QRIS" && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 text-center animate-fade-in space-y-3">
              <div className="text-xs font-black text-gray-800">
                <span>QRIS Merchant: </span>
                <span className="text-brand-700">{currentKantinNama || "Kantin Sekolah"}</span>
              </div>
              <div className="inline-block p-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                {qrisQrCodeUrl ? (
                  <img
                    src={qrisQrCodeUrl}
                    alt="QRIS Pembayaran Kantin"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-44 h-44 bg-gray-100 animate-pulse rounded-xl" />
                )}
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Pindai kode QRIS di atas untuk membayar <strong className="text-gray-900">{formatRupiah(totalPrice)}</strong>.
              </p>
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Setelah bayar, tekan tombol di bawah untuk menyelesaikan pesanan.</span>
              </div>
            </div>
          )}

          {/* Tunai Instructions Box */}
          {metodeTransaksi === "tunai" && (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 text-xs text-amber-900 space-y-1.5 animate-fade-in">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                Pembayaran Tunai di Lokasi
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pesanan Anda akan masuk ke kantin. Harap siapkan uang pas sebesar{" "}
                <strong>{formatRupiah(totalPrice)}</strong> saat mengambil makanan di kasir kantin.
              </p>
            </div>
          )}
        </div>

        {/* Submit Order Floating CTA */}
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full bg-[#1b432a] hover:bg-[#153621] text-white py-4 px-6 rounded-3xl font-extrabold text-sm sm:text-base flex items-center justify-between shadow-floating transition transform active:scale-98 disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                {submitting ? "Memproses Pesanan..." : "Konfirmasi & Pesan Sekarang"}
              </span>
              <span className="text-emerald-300 font-black">{formatRupiah(totalPrice)}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
