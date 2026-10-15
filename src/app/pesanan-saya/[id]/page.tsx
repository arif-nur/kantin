"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Store,
  QrCode,
  Banknote,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";

const STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: "menunggu", label: "Menunggu", desc: "Menunggu konfirmasi kantin" },
  { status: "dikonfirmasi", label: "Dikonfirmasi", desc: "Pesanan diterima kantin" },
  { status: "diproses", label: "Diproses", desc: "Makanan sedang dimasak" },
  { status: "siap_diambil", label: "Siap Diambil", desc: "Ambil makanan di kasir" },
  { status: "selesai", label: "Selesai", desc: "Pesanan telah selesai" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  const orderId = params.id as string;

  const loadOrder = async () => {
    const data = await DataService.getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // Poll every 5s for real-time status update
      const timer = setInterval(loadOrder, 5000);
      return () => clearInterval(timer);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8faf8] p-6 text-center flex flex-col items-center justify-center">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
        <Link href="/pesanan-saya" className="text-xs font-bold text-brand-600 underline">
          Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  const currentStepIndex =
    order.statusPesanan === "dibatalkan"
      ? -1
      : STEPS.findIndex((s) => s.status === order.statusPesanan);

  const handleCancelOrder = async () => {
    setCancelling(true);
    await DataService.updateOrderStatus(order.id, "dibatalkan", "gagal");
    setCancelModal(false);
    setCancelling(false);
    loadOrder();
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
        <Link
          href="/pesanan-saya"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
          Status Pesanan {order.kodePesanan}
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Order Banner & Pickup Code */}
        <div className="bg-[#1b432a] text-white rounded-3xl p-6 shadow-floating text-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-white/10 px-3 py-1 rounded-full">
              Kode Pengambilan Pesanan
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-widest my-3 text-white">
              {order.kodePesanan}
            </div>
            <p className="text-xs text-emerald-100">
              Tunjukkan kode ini ke kasir {order.namaKantinSnapshot} saat mengambil pesanan
            </p>
          </div>
        </div>

        {/* Visual Status Progress */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            Pelacakan Pesanan Real-time
          </h2>

          {order.statusPesanan === "dibatalkan" ? (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 text-xs">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">Pesanan Dibatalkan</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Stok menu telah dikembalikan secara otomatis ke sistem kantin.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-brand-600 border-brand-200 ring-4 ring-emerald-100"
                          : isPassed
                          ? "bg-brand-600 border-white text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isPassed && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-extrabold ${
                          isCurrent
                            ? "text-brand-700"
                            : isPassed
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Details & Items Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Detail Pemesan</p>
              <p className="text-xs font-bold text-gray-900">{order.namaPemesanSnapshot}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Waktu Pemesanan</p>
              <p className="text-xs font-semibold text-gray-700">
                {formatTanggal(order.createdAt)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Item yang Dipesan
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-brand-700 bg-brand-50 w-6 h-6 rounded-lg flex items-center justify-center text-[11px]">
                      {item.jumlahPesanan}x
                    </span>
                    <span className="font-bold text-gray-800">{item.namaMenuSnapshot}</span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {formatRupiah(item.subtotalItem)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.catatan && (
            <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600">
              <span className="font-bold text-gray-800">Catatan:</span> {order.catatan}
            </div>
          )}

          {/* Payment Status Summary */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Metode Pembayaran</span>
              <span className="font-bold text-gray-900 uppercase flex items-center gap-1">
                {order.metodeTransaksi === "QRIS" ? (
                  <QrCode className="w-3.5 h-3.5 text-brand-600" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                )}
                {order.metodeTransaksi}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Status Pembayaran</span>
              <span
                className={`font-black uppercase text-[11px] px-2 py-0.5 rounded-full ${
                  order.statusTransaksi === "berhasil"
                    ? "bg-emerald-200 text-emerald-900"
                    : order.statusTransaksi === "menunggu"
                    ? "bg-amber-200 text-amber-900"
                    : "bg-red-200 text-red-900"
                }`}
              >
                {order.statusTransaksi}
              </span>
            </div>
            <div className="border-t border-emerald-100 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">Total Pembayaran</span>
              <span className="text-base font-extrabold text-brand-700">
                {formatRupiah(order.totalHarga)}
              </span>
            </div>
          </div>

          {/* Cancellation Button if order is still waiting */}
          {order.statusPesanan === "menunggu" && (
            <div className="pt-2">
              <button
                onClick={() => setCancelModal(true)}
                className="w-full py-3 px-4 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Batalkan Pesanan Ini
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Batalkan Pesanan?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan ini? Stok menu akan dikembalikan secara otomatis.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setCancelModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {cancelling ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
