"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  CheckCheck,
  XCircle,
  Eye,
  Store,
  DollarSign,
  AlertCircle,
  RefreshCw,
  QrCode,
  Banknote,
  Volume2,
  VolumeX,
  Printer,
  FileText,
  ShieldCheck,
  Check,
  Wallet,
  Tag,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { playOrderAlertChime } from "@/lib/audio-alert";
import { useAuth } from "@/lib/context/AuthContext";

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: "Menunggu", bg: "bg-amber-100", text: "text-amber-800" },
  dikonfirmasi: { label: "Dikonfirmasi", bg: "bg-blue-100", text: "text-blue-800" },
  diproses: { label: "Diproses", bg: "bg-orange-100", text: "text-orange-800" },
  siap_diambil: { label: "Siap Diambil", bg: "bg-emerald-100", text: "text-emerald-800" },
  selesai: { label: "Selesai", bg: "bg-gray-100", text: "text-gray-700" },
  dibatalkan: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700" },
};

export default function AdminPesananPage() {
  const { isPengelolaKantin, managedKantinId, managedKantinNama } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Sound alert state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Proof modal state
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  // Print order state
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search");
      if (q) setSearchQuery(q);
    }

    setLoading(true);
    const kantinFilter = isPengelolaKantin ? managedKantinId || undefined : undefined;
    const unsubscribe = DataService.subscribeOrders((realtimeOrders) => {
      // Check for incoming new orders to ring chime
      if (!isInitialLoadRef.current && soundEnabled) {
        const hasNewIncoming = realtimeOrders.some(
          (o) => !knownOrderIdsRef.current.has(o.id) && o.statusPesanan === "menunggu"
        );
        if (hasNewIncoming) {
          playOrderAlertChime();
        }
      }

      // Update known order IDs
      realtimeOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialLoadRef.current = false;

      setOrders(realtimeOrders);
      setLoading(false);
    }, kantinFilter);

    return () => unsubscribe();
  }, [isPengelolaKantin, managedKantinId, soundEnabled]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await DataService.getOrders(
      isPengelolaKantin && managedKantinId ? { kantinId: managedKantinId } : undefined
    );
    setOrders(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    statusTransaksi?: Order["statusTransaksi"]
  ) => {
    await DataService.updateOrderStatus(orderId, nextStatus, statusTransaksi);
    loadOrders();
    if (activeOrder && activeOrder.id === orderId) {
      const updated = await DataService.getOrderById(orderId);
      setActiveOrder(updated);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const filteredOrders = orders.filter((o) => {
    const queueCode = o.nomorAntrean ? o.nomorAntrean.toLowerCase() : "";
    const matchesSearch =
      o.kodePesanan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      queueCode.includes(searchQuery.toLowerCase()) ||
      o.namaPemesanSnapshot.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "semua" || o.statusPesanan === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Manajemen Pesanan Mahasiswa
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Pantau nomor antrean, proses memasak, verifikasi pembayaran, dan serah terima makanan
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound toggle button */}
            <button
              onClick={() => {
                if (!soundEnabled) {
                  playOrderAlertChime();
                }
                setSoundEnabled(!soundEnabled);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs border ${
                soundEnabled
                  ? "bg-emerald-50 border-emerald-200 text-[#1b432a]"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
              title={soundEnabled ? "Klik untuk membisukan alarm" : "Klik untuk menyalakan alarm"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#1b432a]" />
                  <span>Alarm Pesanan: Aktif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <span>Alarm: Bisu</span>
                </>
              )}
            </button>

            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari antrean (A-01), kode (B001), atau pemesan..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "semua", label: "Semua" },
              { id: "menunggu", label: "Menunggu" },
              { id: "dikonfirmasi", label: "Dikonfirmasi" },
              { id: "diproses", label: "Diproses" },
              { id: "siap_diambil", label: "Siap Diambil" },
              { id: "selesai", label: "Selesai" },
              { id: "dibatalkan", label: "Dibatalkan" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#1b432a] text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Antrean</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Pemesan</th>
                  <th className="py-3 px-4">Menu & Catatan</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Pembayaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <div className="w-6 h-6 border-2 border-[#1b432a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Memuat data antrean pesanan...</span>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const status = STATUS_CONFIG[order.statusPesanan] || STATUS_CONFIG.menunggu;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition">
                        {/* Nomor Antrean */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center justify-center font-black text-sm px-2.5 py-1 bg-[#1b432a] text-white rounded-xl shadow-xs">
                            {order.nomorAntrean || `A-${order.kodePesanan.slice(-2)}`}
                          </span>
                        </td>

                        {/* Kode Pesanan */}
                        <td className="py-3.5 px-4 font-extrabold text-gray-700 text-xs">
                          {order.kodePesanan}
                        </td>

                        {/* Pemesan */}
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-gray-900">
                            {order.namaPemesanSnapshot}
                          </p>
                          <p className="text-[10px] text-gray-400">{order.namaKantinSnapshot}</p>
                          {order.labelPengambilan && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1">
                              ⏰ {order.labelPengambilan}
                            </span>
                          )}
                        </td>

                        {/* Menu & Catatan */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-800 line-clamp-1 max-w-xs">
                            {order.items
                              ?.map((it) => `${it.jumlahPesanan}x ${it.namaMenuSnapshot}`)
                              .join(", ") || "-"}
                          </p>
                          {order.catatan && (
                            <p className="text-[10px] text-amber-700 font-bold truncate">
                              Catatan: {order.catatan}
                            </p>
                          )}
                          {order.items?.some((it) => it.catatanItem) && (
                            <div className="text-[9px] text-gray-500 mt-0.5 space-y-0.5">
                              {order.items
                                .filter((it) => it.catatanItem)
                                .map((it, idx) => (
                                  <p key={idx} className="italic truncate max-w-xs">
                                    • {it.namaMenuSnapshot}: {it.catatanItem}
                                  </p>
                                ))}
                            </div>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-brand-700 block">
                            {formatRupiah(order.totalHarga)}
                          </span>
                          {order.diskonVoucher && order.diskonVoucher > 0 && (
                            <span className="text-[10px] text-[#16a34a] font-bold block">
                              Voucher: -{formatRupiah(order.diskonVoucher)}
                            </span>
                          )}
                        </td>

                        {/* Pembayaran & Bukti */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                            {order.metodeTransaksi === "KantinPay" ? (
                              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            ) : order.metodeTransaksi === "QRIS" ? (
                              <QrCode className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <Banknote className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{order.metodeTransaksi}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                order.statusTransaksi === "berhasil"
                                  ? "bg-emerald-100 text-brand-800"
                                  : order.statusTransaksi === "menunggu"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.statusTransaksi}
                            </span>
                            {order.buktiBayarUrl && (
                              <button
                                onClick={() => setProofModalUrl(order.buktiBayarUrl || null)}
                                className="text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                title="Lihat Bukti Transfer QRIS"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Bukti</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status Pesanan */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {formatTanggal(order.createdAt)}
                        </td>

                        {/* Aksi Cepat */}
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          {/* Cetak Struk Kasir */}
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            title="Cetak Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Action Button based on status */}
                          {order.statusPesanan === "menunggu" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "dikonfirmasi")}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                            >
                              Konfirmasi
                            </button>
                          )}
                          {order.statusPesanan === "dikonfirmasi" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "diproses")}
                              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                            >
                              Mulai Masak
                            </button>
                          )}
                          {order.statusPesanan === "diproses" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "siap_diambil")}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                            >
                              Siap Diambil
                            </button>
                          )}
                          {order.statusPesanan === "siap_diambil" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "selesai", "berhasil")
                              }
                              className="px-2.5 py-1.5 bg-[#1b432a] hover:bg-[#153621] text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                            >
                              Selesaikan
                            </button>
                          )}

                          {/* Verify QRIS/Cash button if waiting */}
                          {order.statusTransaksi === "menunggu" &&
                            order.statusPesanan !== "dibatalkan" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    order.id,
                                    order.statusPesanan === "menunggu" ? "dikonfirmasi" : order.statusPesanan,
                                    "berhasil"
                                  )
                                }
                                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-bold transition border border-emerald-200"
                                title="Verifikasi Pembayaran Lunas"
                              >
                                Lunas
                              </button>
                            )}

                          {/* Detail Button */}
                          <button
                            onClick={() => setActiveOrder(order)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                            title="Detail Pesanan"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Modal Bukti Transfer QRIS */}
      {proofModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900">Bukti Pembayaran QRIS</h3>
              <button
                onClick={() => setProofModalUrl(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-80 rounded-2xl overflow-hidden relative bg-gray-100 border border-gray-200">
              <Image
                src={proofModalUrl}
                alt="Bukti Transfer QRIS"
                fill
                className="object-contain"
              />
            </div>

            <button
              onClick={() => setProofModalUrl(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Pesanan */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm px-2.5 py-1 bg-[#1b432a] text-white rounded-xl">
                  {activeOrder.nomorAntrean || `A-${activeOrder.kodePesanan.slice(-2)}`}
                </span>
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Pesanan {activeOrder.kodePesanan}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {formatTanggal(activeOrder.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Pemesan:</span>
                <span className="font-extrabold text-gray-900">
                  {activeOrder.namaPemesanSnapshot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kantin Tujuan:</span>
                <span className="font-extrabold text-gray-900">
                  {activeOrder.namaKantinSnapshot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status Pesanan:</span>
                <span className="font-extrabold uppercase text-brand-700">
                  {activeOrder.statusPesanan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status Pembayaran:</span>
                <span className="font-extrabold uppercase text-gray-900">
                  {activeOrder.metodeTransaksi} ({activeOrder.statusTransaksi})
                </span>
              </div>

              {activeOrder.catatan && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900">
                  <span className="font-bold">Catatan Pesanan:</span> {activeOrder.catatan}
                </div>
              )}

              {/* Items List */}
              <div className="pt-2 border-t border-gray-100">
                <p className="font-bold text-gray-700 mb-2">Item yang Dipesan:</p>
                <div className="space-y-2">
                  {activeOrder.items?.map((it, idx) => (
                    <div key={idx} className="bg-gray-50 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-brand-600">{it.jumlahPesanan}x </span>
                          <span className="font-bold text-gray-800">{it.namaMenuSnapshot}</span>
                          <span className="text-[10px] text-gray-400 block">
                            @{formatRupiah(it.hargaMenuSnapshot)}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {formatRupiah(it.subtotalItem)}
                        </span>
                      </div>
                      {it.catatanItem && (
                        <p className="text-[10px] text-emerald-800 font-medium italic bg-emerald-50 px-2 py-0.5 rounded-md">
                          Catatan: {it.catatanItem}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
                <span className="font-bold text-gray-900">Total Pembayaran</span>
                <span className="font-black text-brand-700 text-base">
                  {formatRupiah(activeOrder.totalHarga)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => handlePrintReceipt(activeOrder)}
                className="flex-1 py-2.5 bg-[#1b432a] hover:bg-[#153621] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setActiveOrder(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable thermal receipt layout (58mm/80mm format) */}
      {printingOrder && (
        <div id="thermal-receipt-area" className="p-4 text-black text-xs font-mono max-w-[80mm]">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="font-black text-sm uppercase">KANTIN KAMPUS</h2>
            <p className="text-[10px] font-bold">{printingOrder.namaKantinSnapshot}</p>
            <p className="text-[9px]">{formatTanggal(printingOrder.createdAt)}</p>
          </div>

          {/* Queue Number */}
          <div className="text-center py-3 border-b border-dashed border-black">
            <p className="text-[10px] uppercase font-bold">NOMOR ANTREAN</p>
            <p className="text-3xl font-black tracking-wider">
              {printingOrder.nomorAntrean || `A-${printingOrder.kodePesanan.slice(-2)}`}
            </p>
            <p className="text-[10px] font-bold mt-1">Kode: {printingOrder.kodePesanan}</p>
            <p className="text-[11px] font-bold">Pemesan: {printingOrder.namaPemesanSnapshot}</p>
          </div>

          {/* Items */}
          <div className="py-2 border-b border-dashed border-black space-y-1">
            {printingOrder.items?.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between">
                  <span>
                    {it.jumlahPesanan}x {it.namaMenuSnapshot}
                  </span>
                  <span>{formatRupiah(it.subtotalItem)}</span>
                </div>
                {it.catatanItem && (
                  <p className="text-[9px] pl-2 text-gray-700">[{it.catatanItem}]</p>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 border-b border-dashed border-black space-y-1">
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatRupiah(printingOrder.totalHarga)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Metode: {printingOrder.metodeTransaksi}</span>
              <span>Status: {printingOrder.statusTransaksi}</span>
            </div>
            {printingOrder.catatan && (
              <p className="text-[10px] italic mt-1">Catatan: {printingOrder.catatan}</p>
            )}
          </div>

          <div className="text-center pt-3 text-[9px]">
            <p>Simpan struk ini untuk mengambil makanan di konter.</p>
            <p className="font-bold mt-1">Selamat Menikmati!</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
