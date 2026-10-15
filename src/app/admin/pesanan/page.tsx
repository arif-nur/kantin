"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: "Menunggu", bg: "bg-amber-100", text: "text-amber-800" },
  dikonfirmasi: { label: "Dikonfirmasi", bg: "bg-blue-100", text: "text-blue-800" },
  diproses: { label: "Diproses", bg: "bg-orange-100", text: "text-orange-800" },
  siap_diambil: { label: "Siap Diambil", bg: "bg-emerald-100", text: "text-emerald-800" },
  selesai: { label: "Selesai", bg: "bg-gray-100", text: "text-gray-700" },
  dibatalkan: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700" },
};

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search");
      if (q) setSearchQuery(q);
    }

    setLoading(true);
    const unsubscribe = DataService.subscribeOrders((realtimeOrders) => {
      setOrders(realtimeOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await DataService.getOrders();
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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.kodePesanan.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              Pantau antrean pesanan masuk, proses memasak, dan status serah terima
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pesanan atau nama mahasiswa..."
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
              { id: "dibatalkan", label: "Batal" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === tab.id
                    ? "bg-[#082215] text-emerald-300"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Kode</th>
                  <th className="py-3.5 px-4 font-extrabold">Nama Pemesan</th>
                  <th className="py-3.5 px-4 font-extrabold">Item Pesanan</th>
                  <th className="py-3.5 px-4 font-extrabold">Total Bayar</th>
                  <th className="py-3.5 px-4 font-extrabold">Pembayaran</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 font-extrabold">Waktu</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      Memuat antrean pesanan...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Tidak ada pesanan pada kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const status = STATUS_CONFIG[order.statusPesanan] || {
                      label: order.statusPesanan,
                      bg: "bg-gray-100",
                      text: "text-gray-800",
                    };

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-black text-gray-900 text-sm">
                          {order.kodePesanan}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-gray-900">
                            {order.namaPemesanSnapshot}
                          </p>
                          <p className="text-[10px] text-gray-400">{order.namaKantinSnapshot}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-700 line-clamp-1 max-w-xs">
                            {order.items
                              ?.map((it) => `${it.jumlahPesanan}x ${it.namaMenuSnapshot}`)
                              .join(", ") || "-"}
                          </p>
                          {order.catatan && (
                            <p className="text-[10px] text-amber-600 font-bold truncate">
                              Catatan: {order.catatan}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-brand-700">
                          {formatRupiah(order.totalHarga)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                            {order.metodeTransaksi === "QRIS" ? (
                              <QrCode className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <Banknote className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{order.metodeTransaksi}</span>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              order.statusTransaksi === "berhasil"
                                ? "bg-emerald-100 text-brand-800"
                                : order.statusTransaksi === "menunggu"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.statusTransaksi}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {formatTanggal(order.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
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
                              className="px-2.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                            >
                              Selesaikan
                            </button>
                          )}

                          {/* Verify Cash button if waiting */}
                          {order.metodeTransaksi === "tunai" &&
                            order.statusTransaksi === "menunggu" &&
                            order.statusPesanan !== "dibatalkan" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(order.id, order.statusPesanan, "berhasil")
                                }
                                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-brand-800 rounded-xl text-[11px] font-bold transition"
                                title="Verifikasi Terima Uang Tunai"
                              >
                                Terima Tunai
                              </button>
                            )}

                          {/* Cancel button if not done/cancelled */}
                          {order.statusPesanan !== "selesai" &&
                            order.statusPesanan !== "dibatalkan" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(order.id, "dibatalkan", "gagal")
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                                title="Batalkan Pesanan (Kembalikan Stok)"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                          <button
                            onClick={() => setActiveOrder(order)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                            title="Lihat Detail Pesanan"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Order Detail Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Detail Pesanan</span>
                <h3 className="text-lg font-black text-gray-900">
                  {activeOrder.kodePesanan} • {activeOrder.namaPemesanSnapshot}
                </h3>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Kantin:</span>
                <span className="font-bold text-gray-900">{activeOrder.namaKantinSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Pemesanan:</span>
                <span className="font-bold text-gray-900">
                  {formatTanggal(activeOrder.createdAt)}
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
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <span className="font-bold text-gray-800">Catatan Khusus:</span>{" "}
                  {activeOrder.catatan}
                </div>
              )}

              {/* Items List */}
              <div className="pt-2 border-t border-gray-100">
                <p className="font-bold text-gray-700 mb-2">Item yang Dipesan:</p>
                <div className="space-y-2">
                  {activeOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
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
                onClick={() => setActiveOrder(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
