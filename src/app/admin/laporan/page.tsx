"use client";

import React, { useEffect, useState } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Store,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem, Order, Transaction } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default function AdminLaporanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedKantinId, setSelectedKantinId] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedMetode, setSelectedMetode] = useState("semua");
  const [selectedDateRange, setSelectedDateRange] = useState("semua");

  const loadData = async () => {
    await DataService.initIfEmpty();
    const [o, k, t] = await Promise.all([
      DataService.getOrders(),
      DataService.getKantinList(),
      DataService.getTransactions(),
    ]);
    setOrders(o);
    setKantinList(k);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchKantin = selectedKantinId === "semua" || o.kantinId === selectedKantinId;
    const matchStatus = selectedStatus === "semua" || o.statusPesanan === selectedStatus;
    const matchMetode = selectedMetode === "semua" || o.metodeTransaksi === selectedMetode;
    return matchKantin && matchStatus && matchMetode;
  });

  const totalRevenue = filteredOrders
    .filter((o) => o.statusTransaksi === "berhasil")
    .reduce((sum, o) => sum + o.totalHarga, 0);

  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter((o) => o.statusPesanan === "selesai").length;

  // Best selling items calculation
  const itemMap: Record<string, { name: string; count: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    if (o.statusPesanan !== "dibatalkan" && o.items) {
      o.items.forEach((it) => {
        if (!itemMap[it.namaMenuSnapshot]) {
          itemMap[it.namaMenuSnapshot] = {
            name: it.namaMenuSnapshot,
            count: 0,
            revenue: 0,
          };
        }
        itemMap[it.namaMenuSnapshot].count += it.jumlahPesanan;
        itemMap[it.namaMenuSnapshot].revenue += it.subtotalItem;
      });
    }
  });

  const bestSellers = Object.values(itemMap).sort((a, b) => b.count - a.count);

  const handleExportCSV = () => {
    const headers = [
      "Kode Pesanan",
      "Nama Pemesan",
      "Kantin",
      "Tanggal",
      "Status Pesanan",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Total Bayar",
    ];

    const rows = filteredOrders.map((o) => [
      o.kodePesanan,
      `"${o.namaPemesanSnapshot}"`,
      `"${o.namaKantinSnapshot}"`,
      formatTanggal(o.createdAt),
      o.statusPesanan,
      o.metodeTransaksi,
      o.statusTransaksi,
      o.totalHarga,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan-kantin-sekolah-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Laporan Penjualan & Keuangan
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Analisis performa penjualan kantin dan ekspor rekap ke format CSV
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#082215] hover:bg-[#05170e] text-emerald-400 font-extrabold text-xs rounded-2xl shadow-floating transition transform active:scale-95 border border-emerald-800/40"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Laporan ke CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Pilih Kantin</label>
            <select
              value={selectedKantinId}
              onChange={(e) => setSelectedKantinId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="semua">Semua Kantin</option>
              {kantinList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKantin}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Status Pesanan</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="diproses">Diproses</option>
              <option value="siap_diambil">Siap Diambil</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={selectedMetode}
              onChange={(e) => setSelectedMetode(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="semua">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="tunai">Tunai</option>
            </select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total Pendapatan Bersih
            </span>
            <div className="text-xl sm:text-2xl font-black text-brand-700 mt-1">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              Dari pembayaran yang berhasil
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total Pesanan Masuk
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {totalOrders} Pesanan
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {completedOrders} pesanan selesai diserahkan
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Menu Terlaris Utama
            </span>
            <div className="text-base sm:text-lg font-black text-gray-900 mt-1 truncate">
              {bestSellers[0]?.name || "-"}
            </div>
            <p className="text-[10px] text-brand-600 font-bold mt-1">
              Terjual {bestSellers[0]?.count || 0} porsi
            </p>
          </div>
        </div>

        {/* Best Sellers Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-card">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 mb-4">
            Peringkat Menu Terlaris
          </h3>
          <div className="divide-y divide-gray-100">
            {bestSellers.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-brand-800 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-extrabold text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-800">{item.count} Porsi Terjual</span>
                  <span className="text-[11px] text-brand-600 font-extrabold block">
                    {formatRupiah(item.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
