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
  Printer,
  Receipt,
  X,
  Wallet,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem, Order, Transaction } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

export default function AdminLaporanPage() {
  const { isPengelolaKantin, managedKantinId, managedKantinNama, userProfile } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedKantinId, setSelectedKantinId] = useState(
    isPengelolaKantin && managedKantinId ? managedKantinId : "semua"
  );
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedMetode, setSelectedMetode] = useState("semua");
  const [selectedDateRange, setSelectedDateRange] = useState("hari_ini");

  // Z-Report Modal
  const [showZReportModal, setShowZReportModal] = useState(false);

  const loadData = async () => {
    await DataService.initIfEmpty();
    const [o, k, t] = await Promise.all([
      DataService.getOrders(isPengelolaKantin && managedKantinId ? { kantinId: managedKantinId } : undefined),
      DataService.getKantinList(),
      DataService.getTransactions(),
    ]);
    setOrders(o);
    setKantinList(k);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => {
    if (isPengelolaKantin && managedKantinId) {
      setSelectedKantinId(managedKantinId);
    }
    loadData();
  }, [isPengelolaKantin, managedKantinId]);

  const filteredOrders = orders.filter((o) => {
    const matchKantin = selectedKantinId === "semua" || o.kantinId === selectedKantinId;
    const matchStatus = selectedStatus === "semua" || o.statusPesanan === selectedStatus;
    const matchMetode = selectedMetode === "semua" || o.metodeTransaksi === selectedMetode;

    let matchDate = true;
    if (selectedDateRange !== "semua" && o.createdAt) {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (selectedDateRange === "hari_ini") {
        matchDate = orderDate.toDateString() === now.toDateString();
      } else if (selectedDateRange === "minggu_ini") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchDate = orderDate >= weekAgo;
      } else if (selectedDateRange === "bulan_ini") {
        matchDate =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
      }
    }

    return matchKantin && matchStatus && matchMetode && matchDate;
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
      "Nomor Antrean",
      "Nama Pemesan",
      "Kantin",
      "Tanggal",
      "Jadwal Pengambilan",
      "Status Pesanan",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Diskon Voucher",
      "Total Bayar",
    ];

    const rows = filteredOrders.map((o) => [
      o.kodePesanan,
      o.nomorAntrean || "-",
      `"${o.namaPemesanSnapshot}"`,
      `"${o.namaKantinSnapshot}"`,
      formatTanggal(o.createdAt),
      `"${o.labelPengambilan || "Langsung"}"`,
      o.statusPesanan,
      o.metodeTransaksi,
      o.statusTransaksi,
      o.diskonVoucher || 0,
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
      `laporan-kantin-kampus-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Payment Breakdown
  const totalCash = filteredOrders
    .filter((o) => o.metodeTransaksi === "tunai" && o.statusTransaksi === "berhasil")
    .reduce((s, o) => s + o.totalHarga, 0);

  const totalQRIS = filteredOrders
    .filter((o) => o.metodeTransaksi === "QRIS" && o.statusTransaksi === "berhasil")
    .reduce((s, o) => s + o.totalHarga, 0);

  const totalKantinPay = filteredOrders
    .filter((o) => o.metodeTransaksi === "KantinPay" && o.statusTransaksi === "berhasil")
    .reduce((s, o) => s + o.totalHarga, 0);

  const totalDiskon = filteredOrders.reduce((s, o) => s + (o.diskonVoucher || 0), 0);
  const totalPortions = bestSellers.reduce((s, i) => s + i.count, 0);

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
              Analisis performa penjualan kantin, ekspor Excel/CSV, dan cetak rekap tutup kasir (Z-Report)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowZReportModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Z-Report Harian</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              Rentang Waktu
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="semua">Semua Waktu</option>
              <option value="hari_ini">Hari Ini</option>
              <option value="minggu_ini">7 Hari Terakhir</option>
              <option value="bulan_ini">Bulan Ini</option>
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

        {/* Thermal Z-Report Receipt Modal */}
        {showZReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in border border-gray-100 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      Rekap Tutup Kasir (Z-Report)
                    </h3>
                    <p className="text-[10px] text-gray-400">Ringkasan settlement shift harian</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowZReportModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thermal Receipt Paper */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-2xl border border-gray-200 font-mono text-[11px] text-gray-800 space-y-2.5 shadow-inner">
                <div className="text-center space-y-0.5">
                  <p className="font-extrabold text-xs tracking-wider text-gray-900">KANTIN KAMPUS DIGITAL</p>
                  <p className="text-[10px] text-gray-500">LAPORAN REKAP TUTUP KASIR (Z-REPORT)</p>
                  <p className="text-[10px] text-gray-400">------------------------------------</p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kantin:</span>
                    <span className="font-bold text-gray-900">
                      {isPengelolaKantin && managedKantinNama
                        ? managedKantinNama
                        : selectedKantinId !== "semua"
                        ? kantinList.find((k) => k.id === selectedKantinId)?.namaKantin || "Kantin"
                        : "Semua Kantin (Global)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal:</span>
                    <span>{new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kasir/Admin:</span>
                    <span className="font-bold">{userProfile?.namaPemesan || "Admin"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Filter Jadwal:</span>
                    <span className="capitalize">{selectedDateRange.replace("_", " ")}</span>
                  </div>
                </div>

                <p className="text-gray-300 text-center">------------------------------------</p>

                {/* Sales Summary */}
                <div className="space-y-1">
                  <p className="font-extrabold text-gray-900 uppercase">RINGKASAN PENJUALAN:</p>
                  <div className="flex justify-between">
                    <span>Order Berhasil</span>
                    <span className="font-bold">{completedOrders} trx</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Porsi Terjual</span>
                    <span className="font-bold">{totalPortions} porsi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Omzet Kotor</span>
                    <span className="font-bold">{formatRupiah(totalRevenue + totalDiskon)}</span>
                  </div>
                  {totalDiskon > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon Voucher</span>
                      <span className="font-bold">-{formatRupiah(totalDiskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black text-[#16a34a] pt-1 border-t border-dashed border-gray-300">
                    <span>TOTAL BERSIH (NET)</span>
                    <span>{formatRupiah(totalRevenue)}</span>
                  </div>
                </div>

                <p className="text-gray-300 text-center">------------------------------------</p>

                {/* Payment Breakdown */}
                <div className="space-y-1">
                  <p className="font-extrabold text-gray-900 uppercase">RINCIAN METODE BAYAR:</p>
                  <div className="flex justify-between">
                    <span>1. Tunai (Kasir)</span>
                    <span className="font-bold">{formatRupiah(totalCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. QRIS Online</span>
                    <span className="font-bold">{formatRupiah(totalQRIS)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3. KantinPay (Saldo)</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(totalKantinPay)}</span>
                  </div>
                </div>

                <p className="text-gray-300 text-center">------------------------------------</p>

                {/* Top Sellers */}
                <div className="space-y-1">
                  <p className="font-extrabold text-gray-900 uppercase">TOP MENU TERLARIS:</p>
                  {bestSellers.slice(0, 5).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="truncate pr-2">{idx + 1}. {it.name}</span>
                      <span className="font-bold whitespace-nowrap">{it.count}x ({formatRupiah(it.revenue)})</span>
                    </div>
                  ))}
                </div>

                <p className="text-gray-300 text-center">------------------------------------</p>
                <div className="text-center text-[9px] text-gray-400 space-y-0.5">
                  <p>DICETAK SECARA OTOMATIS OLEH SISTEM</p>
                  <p>{new Date().toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowZReportModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-[#16a34a] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
