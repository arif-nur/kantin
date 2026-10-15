"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  DollarSign,
  Store,
  Users,
  AlertTriangle,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Kantin, MenuItem, Order, OrderStatus, Transaction, UserProfile } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";

const STATUS_BADGES: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: "Menunggu", bg: "bg-amber-100", text: "text-amber-800" },
  dikonfirmasi: { label: "Dikonfirmasi", bg: "bg-blue-100", text: "text-blue-800" },
  diproses: { label: "Diproses", bg: "bg-orange-100", text: "text-orange-800" },
  siap_diambil: { label: "Siap Diambil", bg: "bg-emerald-100", text: "text-emerald-800" },
  selesai: { label: "Selesai", bg: "bg-gray-100", text: "text-gray-700" },
  dibatalkan: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700" },
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    await DataService.initIfEmpty();
    const [o, m, k, u, t] = await Promise.all([
      DataService.getOrders(),
      DataService.getMenuList(),
      DataService.getKantinList(),
      DataService.getUsers(),
      DataService.getTransactions(),
    ]);
    setOrders(o);
    setMenuList(m);
    setKantinList(k);
    setUsersList(u);
    setTransactions(t);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const totalOrdersToday = orders.length;
  const waitingOrders = orders.filter((o) => o.statusPesanan === "menunggu").length;
  const processingOrders = orders.filter(
    (o) => o.statusPesanan === "diproses" || o.statusPesanan === "dikonfirmasi"
  ).length;
  const readyOrders = orders.filter((o) => o.statusPesanan === "siap_diambil").length;

  const successfulRevenue = transactions
    .filter((t) => t.statusTransaksi === "berhasil")
    .reduce((sum, t) => sum + t.jumlahPembayaran, 0);

  const activeMenuItemsCount = menuList.filter((m) => m.isAvailable && m.stok > 0).length;
  const lowStockItems = menuList.filter((m) => m.stok <= 5);

  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    statusTransaksi?: Order["statusTransaksi"]
  ) => {
    await DataService.updateOrderStatus(orderId, nextStatus, statusTransaksi);
    loadData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Dashboard Kantin Sekolah
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Ringkasan operasional pesanan, stok menu, dan pendapatan hari ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-brand-800">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
              Kantin Buka & Aktif
            </span>
          </div>
        </div>

        {/* 5 Top Summary Stat Cards matching reference design */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Pesanan
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-brand-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900">{totalOrdersToday}</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5% hari ini</span>
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Pesanan Aktif
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-orange-600">
                {waitingOrders + processingOrders + readyOrders}
              </div>
              <div className="text-[10px] text-gray-400 font-semibold mt-1">
                {waitingOrders} baru, {processingOrders} diproses
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Pendapatan
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-brand-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">
                {formatRupiah(successfulRevenue)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                Transaksi berhasil
              </div>
            </div>
          </div>

          {/* Active Canteens */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Kantin Aktif
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                {kantinList.length}
              </div>
              <div className="text-[10px] text-gray-400 font-semibold mt-1">
                {activeMenuItemsCount} menu tersedia
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Data Pemesan
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900">
                {usersList.length}
              </div>
              <div className="text-[10px] text-purple-600 font-bold mt-1">
                Mahasiswa terdaftar
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Chart & Top Menu Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Performance Visualizer */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Grafik Penjualan & Pendapatan
                </h3>
                <p className="text-xs text-gray-400">Tren pemesanan selama 7 hari terakhir</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-extrabold bg-[#082215] text-emerald-300 rounded-lg">
                  Minggu Ini
                </span>
              </div>
            </div>

            {/* SVG Interactive Trendline Graph */}
            <div className="h-52 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f9" strokeDasharray="4" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeDasharray="4" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="#f1f5f9" strokeDasharray="4" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#e2e8f0" />

                {/* Area under curve */}
                <path
                  d="M 20 120 C 100 130, 160 80, 240 70 C 320 60, 380 90, 460 30 C 520 40, 560 20, 580 15 L 580 150 L 20 150 Z"
                  fill="url(#areaGrad)"
                />

                {/* Smooth curve line */}
                <path
                  d="M 20 120 C 100 130, 160 80, 240 70 C 320 60, 380 90, 460 30 C 520 40, 560 20, 580 15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { cx: 20, cy: 120, label: "Sen" },
                  { cx: 110, cy: 125, label: "Sel" },
                  { cx: 200, cy: 75, label: "Rab" },
                  { cx: 300, cy: 65, label: "Kam" },
                  { cx: 400, cy: 75, label: "Jum" },
                  { cx: 500, cy: 25, label: "Sab" },
                  { cx: 580, cy: 15, label: "Min" },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={pt.cx} y="165" fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="bold">
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Top Menu Best Sellers */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Menu Terlaris
                </h3>
                <span className="text-[10px] font-bold text-gray-400">Berdasarkan Pesanan</span>
              </div>

              <div className="space-y-3.5">
                {menuList.slice(0, 4).map((menu, i) => {
                  const percentage = [85, 70, 55, 40][i] || 30;
                  return (
                    <div key={menu.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-brand-800 text-[10px] flex items-center justify-center font-black">
                            {i + 1}
                          </span>
                          {menu.namaMenu}
                        </span>
                        <span className="font-bold text-brand-600">
                          {formatRupiah(menu.hargaMenu)}
                        </span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link to manage menu */}
            <Link
              href="/admin/menu"
              className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-brand-700 flex items-center justify-between hover:text-brand-800"
            >
              <span>Kelola Semua Menu Kantin</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts Banner */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-900">
                  Peringatan Stok Menipis ({lowStockItems.length} Menu)
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {lowStockItems.map((m) => `${m.namaMenu} (sisa ${m.stok})`).join(", ")}
                </p>
              </div>
            </div>
            <Link
              href="/admin/menu"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Update Stok Sekarang
            </Link>
          </div>
        )}

        {/* Recent Orders Table matching reference design */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Pesanan Masuk Terbaru
              </h3>
              <p className="text-xs text-gray-400">
                Kelola status pemrosesan dan verifikasi pembayaran pesanan
              </p>
            </div>
            <Link
              href="/admin/pesanan"
              className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center"
            >
              Lihat Semua Pesanan ({orders.length}) <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="pb-3 font-extrabold">Kode Pesanan</th>
                  <th className="pb-3 font-extrabold">Pemesan</th>
                  <th className="pb-3 font-extrabold">Kantin</th>
                  <th className="pb-3 font-extrabold">Total Bayar</th>
                  <th className="pb-3 font-extrabold">Metode</th>
                  <th className="pb-3 font-extrabold">Status Pesanan</th>
                  <th className="pb-3 font-extrabold">Waktu</th>
                  <th className="pb-3 font-extrabold text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.slice(0, 6).map((order) => {
                  const status = STATUS_BADGES[order.statusPesanan] || {
                    label: order.statusPesanan,
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                  };

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 font-black text-gray-900">{order.kodePesanan}</td>
                      <td className="py-3 font-bold text-gray-800">
                        {order.namaPemesanSnapshot}
                      </td>
                      <td className="py-3 text-gray-600">{order.namaKantinSnapshot}</td>
                      <td className="py-3 font-extrabold text-brand-700">
                        {formatRupiah(order.totalHarga)}
                      </td>
                      <td className="py-3 font-bold uppercase text-gray-600">
                        {order.metodeTransaksi}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-[11px]">
                        {formatTanggal(order.createdAt)}
                      </td>
                      <td className="py-3 text-right space-x-1">
                        {order.statusPesanan === "menunggu" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "dikonfirmasi")}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition"
                            title="Konfirmasi Pesanan"
                          >
                            Konfirmasi
                          </button>
                        )}
                        {order.statusPesanan === "dikonfirmasi" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "diproses")}
                            className="px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-[10px] font-bold transition"
                            title="Mulai Masak"
                          >
                            Masak
                          </button>
                        )}
                        {order.statusPesanan === "diproses" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "siap_diambil")}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition"
                            title="Siap Diambil"
                          >
                            Siap
                          </button>
                        )}
                        {order.statusPesanan === "siap_diambil" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "selesai", "berhasil")
                            }
                            className="px-2 py-1 bg-brand-600 text-white hover:bg-brand-700 rounded-lg text-[10px] font-bold transition"
                            title="Selesaikan & Verifikasi Pembayaran"
                          >
                            Selesai
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
