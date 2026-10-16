"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  Store,
  Lock,
  UploadCloud,
  Tag,
  Bell,
  Sparkles,
  Wallet,
} from "lucide-react";
import QRCode from "qrcode";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { DataService } from "@/lib/data-service";
import { formatRupiah, isKantinOperational } from "@/lib/utils";
import { JadwalPengambilan, PaymentMethod } from "@/types";

const JADWAL_OPTIONS: { id: JadwalPengambilan; label: string; sublabel: string; icon: any }[] = [
  {
    id: "langsung",
    label: "Sekarang (~15 Menit)",
    sublabel: "Dimasak & disiapkan langsung",
    icon: Sparkles,
  },
  {
    id: "istirahat_1",
    label: "Jeda Kuliah Siang (11:45 WIB)",
    sublabel: "Siap santap saat sela kuliah siang",
    icon: Bell,
  },
  {
    id: "istirahat_2",
    label: "Jeda Kuliah Sore (15:15 WIB)",
    sublabel: "Siap hangat menjelang kuliah sore",
    icon: Clock,
  },
];

function buildDynamicQrisPayload(canteenName: string, amount: number): string {
  const cleanName = (canteenName || "KANTIN KAMPUS").toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 22);
  const nameLen = String(cleanName.length).padStart(2, "0");
  const amountStr = String(amount);
  const amountLen = String(amountStr.length).padStart(2, "0");
  const refCode = `TRX${Date.now().toString().slice(-4)}`;

  return `00020101021226670014ID.LINKAJA.WWW011893600914000000000002150000000000000000303UMI51440014ID.CO.QRIS.WWW0215ID102002123456752045812530336054${amountLen}${amountStr}5802ID59${nameLen}${cleanName}6007JAKARTA62070703${refCode}6304`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    currentKantinId,
    currentKantinNama,
    subtotal,
    totalPrice,
    appliedVoucher,
    voucherDiscount,
    clearCart,
  } = useCart();
  const { userProfile, loading: authLoading } = useAuth();

  const [metodeTransaksi, setMetodeTransaksi] = useState<PaymentMethod>("KantinPay");
  const [userSaldo, setUserSaldo] = useState<number>(0);
  const [jadwalPengambilan, setJadwalPengambilan] = useState<JadwalPengambilan>("langsung");
  const [customTime, setCustomTime] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrisQrCodeUrl, setQrisQrCodeUrl] = useState<string>("");
  const [buktiTransferUrl, setBuktiTransferUrl] = useState<string>("");

  useEffect(() => {
    async function fetchSaldo() {
      if (userProfile?.uid) {
        const s = await DataService.getSaldo(userProfile.uid);
        setUserSaldo(s);
        if (s >= totalPrice && totalPrice > 0) {
          setMetodeTransaksi("KantinPay");
        } else {
          setMetodeTransaksi("QRIS");
        }
      }
    }
    fetchSaldo();
  }, [userProfile, totalPrice]);

  const handleUploadBukti = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBuktiTransferUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    async function makeQR() {
      try {
        const dynamicPayload = buildDynamicQrisPayload(currentKantinNama || "Kantin Kampus", totalPrice);
        const url = await QRCode.toDataURL(dynamicPayload, {
          margin: 1,
          width: 240,
          color: {
            dark: "#0f2e1c",
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

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.replace("/login?redirect=/checkout");
    }
  }, [userProfile, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#16a34a] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-gray-900">
            Masuk untuk Melanjutkan
          </h2>
          <p className="text-xs text-gray-500">
            Silakan login agar pesanan Anda dapat tercatat dan diproses kantin.
          </p>
          <Link
            href="/login?redirect=/checkout"
            className="block py-2.5 px-4 bg-[#16a34a] text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">Keranjang Kosong</h2>
          <p className="text-xs text-gray-500">
            Pilih menu makanan terlebih dahulu sebelum melanjutkan ke pembayaran.
          </p>
          <Link
            href="/menu"
            className="block py-2.5 px-4 bg-[#16a34a] text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition"
          >
            Pilih Menu
          </Link>
        </div>
      </div>
    );
  }

  const getLabelPengambilan = () => {
    if (jadwalPengambilan === "istirahat_1") return "Jeda Kuliah Siang (11:45 WIB)";
    if (jadwalPengambilan === "istirahat_2") return "Jeda Kuliah Sore (15:15 WIB)";
    if (jadwalPengambilan === "kustom" && customTime) return `Kustom Jam: ${customTime} WIB`;
    return "Langsung / Sekarang (~15 Menit)";
  };

  const handleCheckout = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const settings = await DataService.getSettings();
      const op = isKantinOperational(settings.jamBuka, settings.jamTutup, settings.isStoreOpenManual);
      if (!op.isOpen) {
        setErrorMessage(settings.pesanTutup || op.reason || "Kantin sedang tutup saat ini.");
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // offline fallback
    }

    try {
      if (metodeTransaksi === "KantinPay" && userSaldo < totalPrice) {
        setErrorMessage(
          `Saldo KantinPay tidak mencukupi (Saldo: Rp ${userSaldo.toLocaleString("id-ID")}). Silakan top up saldo atau gunakan QRIS / Tunai.`
        );
        setSubmitting(false);
        return;
      }

      const labelPengambilan = getLabelPengambilan();

      const result = await DataService.checkout({
        pemesanId: userProfile.uid,
        namaPemesan: userProfile.namaPemesan,
        kantinId: currentKantinId || "kantin-01",
        namaKantin: currentKantinNama || "Kantin Kampus",
        metodeTransaksi,
        catatan,
        buktiBayarUrl: buktiTransferUrl,
        jadwalPengambilan,
        labelPengambilan,
        kodeVoucher: appliedVoucher?.kode,
        diskonVoucher: voucherDiscount,
        items,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Gagal memproses pesanan.");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/pesanan-saya/${result.orderId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses pesanan.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/70 px-4 h-14 flex items-center justify-between max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-sm sm:text-base font-extrabold text-gray-900">
          Pembayaran Pesanan
        </h1>
        <div className="w-8" />
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-3.5">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Canteen & Delivery Info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#16a34a]" />
            <span className="text-xs font-bold text-gray-900">
              {currentKantinNama || "Kantin Kampus"}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 pl-6">
            Pemesan: <strong className="text-gray-800">{userProfile.namaPemesan}</strong> ({userProfile.kodePemesan || "Mahasiswa"})
          </div>
        </div>

        {/* Pre-Order Jadwal Pengambilan Section */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#16a34a]" />
              Jadwal Ambil Makanan
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Pre-Order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {JADWAL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = jadwalPengambilan === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setJadwalPengambilan(opt.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? "border-[#16a34a] bg-emerald-50/60 shadow-2xs"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#16a34a]" : "text-gray-400"}`} />
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {opt.sublabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Rincian Menu ({items.length} Macam)
          </h2>
          <div className="divide-y divide-gray-100">
            {items.map(({ menu, quantity, catatanItem }) => (
              <div key={menu.id} className="py-2 flex items-start justify-between text-xs gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#16a34a]">{quantity}x</span>
                    <span className="font-semibold text-gray-900 truncate">{menu.namaMenu}</span>
                  </div>
                  {catatanItem && (
                    <p className="text-[10px] text-gray-400 italic pl-5 mt-0.5">
                      Catatan: {catatanItem}
                    </p>
                  )}
                </div>
                <span className="font-bold text-gray-800 whitespace-nowrap">
                  {formatRupiah(menu.hargaMenu * quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* General Order Notes */}
          <div className="pt-2 border-t border-gray-100">
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan umum (cth: tolong dibungkus rapat)..."
              className="w-full text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#16a34a]"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Metode Pembayaran
            </h2>
            <span className="text-[10px] text-gray-500">
              Pilih cara bayar yang paling mudah
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* KantinPay Tab */}
            <button
              type="button"
              onClick={() => setMetodeTransaksi("KantinPay")}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                metodeTransaksi === "KantinPay"
                  ? "border-[#16a34a] bg-emerald-50/70 shadow-2xs ring-1 ring-[#16a34a]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Wallet className={`w-4 h-4 ${metodeTransaksi === "KantinPay" ? "text-[#16a34a]" : "text-gray-400"}`} />
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded">
                  1 Detik
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">KantinPay</p>
                <p className="text-[10px] text-[#16a34a] font-semibold mt-0.5 truncate">
                  {formatRupiah(userSaldo)}
                </p>
              </div>
            </button>

            {/* QRIS Tab */}
            <button
              type="button"
              onClick={() => setMetodeTransaksi("QRIS")}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                metodeTransaksi === "QRIS"
                  ? "border-[#16a34a] bg-emerald-50/70 shadow-2xs ring-1 ring-[#16a34a]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <QrCode className={`w-4 h-4 ${metodeTransaksi === "QRIS" ? "text-[#16a34a]" : "text-gray-400"}`} />
                <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1 py-0.2 rounded">
                  Scan
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">QRIS</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Semua Bank</p>
              </div>
            </button>

            {/* Tunai Tab */}
            <button
              type="button"
              onClick={() => setMetodeTransaksi("tunai")}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                metodeTransaksi === "tunai"
                  ? "border-[#16a34a] bg-emerald-50/70 shadow-2xs ring-1 ring-[#16a34a]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Banknote className={`w-4 h-4 ${metodeTransaksi === "tunai" ? "text-[#16a34a]" : "text-gray-400"}`} />
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                  Kasir
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Tunai</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Bayar di kasir</p>
              </div>
            </button>
          </div>

          {/* KantinPay Box */}
          {metodeTransaksi === "KantinPay" && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xs space-y-2.5 animate-fade-in border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    KP
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Saldo KantinPay Mahasiswa
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-white">
                      {formatRupiah(userSaldo)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/akun#kantinpay"
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold rounded-lg transition"
                >
                  + Top Up
                </Link>
              </div>

              {userSaldo >= totalPrice ? (
                <div className="p-2 bg-emerald-900/40 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2 border border-emerald-700/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Saldo mencukupi! Pesanan langsung terkonfirmasi otomatis tanpa scan QRIS.</span>
                </div>
              ) : (
                <div className="p-2 bg-amber-950/60 rounded-lg text-amber-300 text-[11px] flex items-start gap-2 border border-amber-700/40">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>
                      Saldo kurang <strong>{formatRupiah(totalPrice - userSaldo)}</strong>. Silakan top up saldo atau gunakan QRIS/Tunai.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QRIS Box */}
          {metodeTransaksi === "QRIS" && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 text-center space-y-3 animate-fade-in">
              <div className="text-xs font-bold text-gray-800">
                Pindai QRIS untuk membayar: <span className="text-[#16a34a]">{formatRupiah(totalPrice)}</span>
              </div>

              <div className="inline-block p-2.5 bg-white rounded-xl shadow-xs border border-gray-200">
                {qrisQrCodeUrl ? (
                  <img
                    src={qrisQrCodeUrl}
                    alt="QRIS Pembayaran Kantin"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-100 animate-pulse rounded-lg" />
                )}
              </div>

              <p className="text-[11px] text-gray-500">
                Mendukung semua aplikasi perbankan & e-wallet berstandar QRIS.
              </p>

              {/* Upload Proof */}
              <div className="pt-2 border-t border-gray-200 text-left">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">Lampirkan Bukti Transfer (Opsional)</span>
                  {buktiTransferUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold">✓ Terlampir</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition">
                    <UploadCloud className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span>{buktiTransferUrl ? "Ganti Tangkapan Layar" : "Pilih Foto / Screenshot"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBukti}
                      className="hidden"
                    />
                  </label>
                  {buktiTransferUrl && (
                    <button
                      type="button"
                      onClick={() => setBuktiTransferUrl("")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tunai Box */}
          {metodeTransaksi === "tunai" && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 animate-fade-in">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Bayar di Kasir Kantin
              </p>
              <p className="text-[11px] text-amber-800">
                Silakan siapkan uang pas sebesar <strong>{formatRupiah(totalPrice)}</strong> saat mengambil pesanan di kasir.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Menu</span>
            <span className="font-bold text-gray-900">{formatRupiah(subtotal)}</span>
          </div>
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-[#16a34a] font-bold">
              <span>Diskon Voucher ({appliedVoucher?.kode})</span>
              <span>-{formatRupiah(voucherDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Waktu Pengambilan</span>
            <span className="font-bold text-gray-800">{getLabelPengambilan()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Biaya Layanan</span>
            <span className="font-bold text-[#16a34a]">GRATIS</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-sm font-bold">
            <span className="text-gray-900">Total Pembayaran</span>
            <span className="text-base font-extrabold text-[#16a34a]">
              {formatRupiah(totalPrice)}
            </span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Order Confirmation Button */}
      <aside aria-label="Aksi Konfirmasi Pesanan" className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-gray-400 font-semibold leading-tight">Total Bayar</div>
            <div className="text-base font-extrabold text-[#16a34a]">
              {formatRupiah(totalPrice)}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || (metodeTransaksi === "KantinPay" && userSaldo < totalPrice)}
            className="py-2.5 px-6 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {submitting
                ? "Memproses..."
                : metodeTransaksi === "KantinPay" && userSaldo < totalPrice
                ? "Saldo Kurang (Top Up Dulu)"
                : "Konfirmasi & Pesan"}
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </div>
  );
}
