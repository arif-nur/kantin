"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Banknote,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Transaction, PaymentStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default function AdminTransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");

  const loadData = async () => {
    await DataService.initIfEmpty();
    const data = await DataService.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyPayment = async (orderId: string) => {
    await DataService.updateOrderStatus(orderId, "dikonfirmasi", "berhasil");
    loadData();
  };

  const totalSuccess = transactions
    .filter((t) => t.statusTransaksi === "berhasil")
    .reduce((sum, t) => sum + t.jumlahPembayaran, 0);

  const totalPending = transactions
    .filter((t) => t.statusTransaksi === "menunggu")
    .reduce((sum, t) => sum + t.jumlahPembayaran, 0);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.kodeTransaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referensiPembayaran?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "semua" || t.statusTransaksi === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Data Transaksi & Pembayaran
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Rekapitulasi riwayat transaksi QRIS dan verifikasi uang tunai
            </p>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total Pembayaran Berhasil
            </span>
            <div className="text-xl sm:text-2xl font-black text-brand-700 mt-1">
              {formatRupiah(totalSuccess)}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              Sudah masuk kas kasir kantin
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Menunggu Verifikasi (Pending)
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {formatRupiah(totalPending)}
            </div>
            <p className="text-[10px] text-amber-600 font-bold mt-1">
              Menunggu konfirmasi kasir
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Total Transaksi
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {transactions.length}
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              Semua metode pembayaran
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode (C001) atau nomor referensi..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {["semua", "berhasil", "menunggu", "gagal"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  statusFilter === status
                    ? "bg-[#082215] text-emerald-300"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Kode Trx</th>
                  <th className="py-3.5 px-4 font-extrabold">Metode</th>
                  <th className="py-3.5 px-4 font-extrabold">Nominal</th>
                  <th className="py-3.5 px-4 font-extrabold">Referensi Transaksi</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 font-extrabold">Waktu Pembayaran</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                ) : (
                  filtered.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-black text-gray-900">{trx.kodeTransaksi}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                          {trx.metodeTransaksi === "QRIS" ? (
                            <QrCode className="w-3.5 h-3.5 text-brand-600" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{trx.metodeTransaksi}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-brand-700">
                        {formatRupiah(trx.jumlahPembayaran)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                        {trx.referensiPembayaran || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            trx.statusTransaksi === "berhasil"
                              ? "bg-emerald-100 text-brand-800"
                              : trx.statusTransaksi === "menunggu"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trx.statusTransaksi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {trx.waktuPembayaran ? formatTanggal(trx.waktuPembayaran) : "Belum terbayar"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {trx.statusTransaksi === "menunggu" && (
                          <button
                            onClick={() => handleVerifyPayment(trx.pesananId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition"
                          >
                            Verifikasi Sekarang
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
