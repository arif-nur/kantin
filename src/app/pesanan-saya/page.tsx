"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Store, ChevronRight, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  menunggu: { label: "Menunggu", bg: "bg-amber-50 text-amber-800 border-amber-200", text: "text-amber-800" },
  dikonfirmasi: { label: "Diterima", bg: "bg-blue-50 text-blue-800 border-blue-200", text: "text-blue-800" },
  diproses: { label: "Dimasak", bg: "bg-orange-50 text-orange-800 border-orange-200", text: "text-orange-800" },
  siap_diambil: { label: "Siap Diambil", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", text: "text-emerald-800" },
  selesai: { label: "Selesai", bg: "bg-gray-50 text-gray-700 border-gray-200", text: "text-gray-700" },
  dibatalkan: { label: "Batal", bg: "bg-red-50 text-red-700 border-red-200", text: "text-red-700" },
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
    { id: "diproses", label: "Dimasak" },
    { id: "siap_diambil", label: "Siap Diambil" },
    { id: "selesai", label: "Selesai" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "semua") return true;
    if (activeTab === "diproses") return order.statusPesanan === "diproses" || order.statusPesanan === "dikonfirmasi";
    return order.statusPesanan === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/70 px-4 h-14 flex items-center justify-between max-w-xl mx-auto">
        <Link
          href="/menu"
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
          aria-label="Kembali ke menu"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm sm:text-base font-extrabold text-gray-900">
          Pesanan Saya
        </h1>
        <div className="w-8" />
      </header>

      <main className="max-w-xl mx-auto px-4 pt-3.5 space-y-3.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-[#16a34a] text-white shadow-2xs"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
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
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 mt-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2.5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Belum Ada Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Pesanan makananmu akan tercatat otomatis di sini.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
            >
              Pesan Menu Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.statusPesanan] || {
                label: order.statusPesanan,
                bg: "bg-gray-100 text-gray-700 border-gray-200",
                text: "text-gray-700",
              };

              return (
                <Link
                  key={order.id}
                  href={`/pesanan-saya/${order.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-gray-200 transition group"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        {order.nomorAntrean || order.kodePesanan}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatTanggal(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${status.bg}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#16a34a]" />
                        {order.namaKantinSnapshot}
                      </p>
                      <p className="text-xs font-bold text-gray-900 mt-1 line-clamp-1">
                        {order.items?.map((it) => `${it.jumlahPesanan}x ${it.namaMenuSnapshot}`).join(", ") ||
                          "Menu Pesanan"}
                      </p>
                      <p className="text-xs font-extrabold text-[#16a34a] mt-1">
                        {formatRupiah(order.totalHarga)}
                      </p>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-gray-400 group-hover:text-[#16a34a] transition self-center">
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
