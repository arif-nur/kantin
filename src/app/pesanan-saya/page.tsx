"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Store, ChevronRight, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: "Menunggu", bg: "bg-amber-100", text: "text-amber-800" },
  dikonfirmasi: { label: "Dikonfirmasi", bg: "bg-blue-100", text: "text-blue-800" },
  diproses: { label: "Sedang Dimasak", bg: "bg-orange-100", text: "text-orange-800" },
  siap_diambil: { label: "Siap Diambil", bg: "bg-emerald-100", text: "text-emerald-800" },
  selesai: { label: "Selesai", bg: "bg-gray-100", text: "text-gray-700" },
  dibatalkan: { label: "Dibatalkan", bg: "bg-red-100", text: "text-red-700" },
};

export default function PesananSayaPage() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("semua");

  useEffect(() => {
    async function loadOrders() {
      await DataService.initIfEmpty();
      const allOrders = await DataService.getOrders({
        pemesanId: userProfile?.uid,
      });
      setOrders(allOrders);
      setLoading(false);
    }
    loadOrders();
  }, [userProfile]);

  const tabs = [
    { id: "semua", label: "Semua" },
    { id: "menunggu", label: "Menunggu" },
    { id: "diproses", label: "Diproses" },
    { id: "siap_diambil", label: "Siap Diambil" },
    { id: "selesai", label: "Selesai" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "semua") return true;
    return order.statusPesanan === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
        <Link
          href="/menu"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
          Riwayat Pesanan Saya
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                activeTab === tab.id
                  ? "bg-[#1b432a] text-white shadow-emerald-900/10"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-3xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-gray-100 mt-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Belum Ada Pesanan</h3>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Pesanan makanan Anda akan tercatat di sini secara otomatis.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-2xl shadow-floating hover:bg-brand-700 transition"
            >
              Pesan Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.statusPesanan] || {
                label: order.statusPesanan,
                bg: "bg-gray-100",
                text: "text-gray-800",
              };

              return (
                <Link
                  key={order.id}
                  href={`/pesanan-saya/${order.id}`}
                  className="block bg-white rounded-3xl p-4 shadow-card border border-gray-100 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-xl">
                        {order.kodePesanan}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatTanggal(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-brand-600" />
                        {order.namaKantinSnapshot}
                      </p>
                      <p className="text-xs text-gray-700 mt-1 line-clamp-1">
                        {order.items?.map((it) => `${it.jumlahPesanan}x ${it.namaMenuSnapshot}`).join(", ") ||
                          "Menu Pesanan"}
                      </p>
                      <p className="text-sm font-extrabold text-brand-600 mt-1">
                        {formatRupiah(order.totalHarga)}
                      </p>
                    </div>

                    <div className="flex items-center text-xs font-bold text-brand-700 group-hover:translate-x-1 transition">
                      <span>Detail</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
