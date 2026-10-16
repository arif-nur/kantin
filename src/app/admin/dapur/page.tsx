"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Clock,
  CheckCircle,
  Bell,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChefHat,
  Sparkles,
  Phone,
  ArrowRight,
  CheckCheck,
  AlertCircle,
  Layers,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus, JadwalPengambilan } from "@/types";
import { formatTanggal } from "@/lib/utils";
import { playOrderAlertChime } from "@/lib/audio-alert";
import { useAuth } from "@/lib/context/AuthContext";

const JADWAL_FILTERS: { id: string; label: string; icon: any }[] = [
  { id: "semua", label: "Semua Jadwal", icon: Layers },
  { id: "langsung", label: "Langsung (~15m)", icon: Sparkles },
  { id: "istirahat_1", label: "Jeda Kuliah Siang (11:45)", icon: Bell },
  { id: "istirahat_2", label: "Jeda Kuliah Sore (15:15)", icon: Clock },
];

export default function AdminDapurPage() {
  const { isPengelolaKantin, managedKantinId, managedKantinNama } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [jadwalFilter, setJadwalFilter] = useState<string>("semua");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBatchSummary, setShowBatchSummary] = useState(true);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    setLoading(true);
    const kantinFilter = isPengelolaKantin ? managedKantinId || undefined : undefined;

    const unsubscribe = DataService.subscribeOrders((realtimeOrders) => {
      // Ring chime if incoming waiting order
      if (!isInitialLoadRef.current && soundEnabled) {
        const hasNew = realtimeOrders.some(
          (o) => !knownOrderIdsRef.current.has(o.id) && o.statusPesanan === "menunggu"
        );
        if (hasNew) {
          playOrderAlertChime();
        }
      }

      realtimeOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialLoadRef.current = false;

      setOrders(realtimeOrders);
      setLoading(false);
    }, kantinFilter);

    return () => unsubscribe();
  }, [isPengelolaKantin, managedKantinId, soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, statusPesanan: nextStatus } : o))
    );
    await DataService.updateOrderStatus(orderId, nextStatus);
  };

  const handleSendWhatsApp = (order: Order) => {
    const phone = (order as any).noTlpSnapshot || "";
    const cleanPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone.replace(/[^0-9]/g, "");
    const antrean = order.nomorAntrean || order.kodePesanan;
    const kantin = order.namaKantinSnapshot || "Kantin";
    const pesan = encodeURIComponent(
      `Halo Kak *${order.namaPemesanSnapshot}*! 👋\n\nPesanan nomor *#${antrean}* di stand *${kantin}* sudah *SIAP DIAMBIL* di etalase!\n\nSilakan tunjukkan nomor antrean ini saat pengambilan. Selamat menikmati makanannya! 🍱✨`
    );

    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${pesan}` : `https://wa.me/?text=${pesan}`;
    window.open(waUrl, "_blank");
  };

  // Filter orders by selected schedule slot
  const filteredOrders = orders.filter((o) => {
    if (jadwalFilter === "semua") return true;
    return (o.jadwalPengambilan || "langsung") === jadwalFilter;
  });

  // Active cooking orders (not finished or cancelled)
  const activeOrders = filteredOrders.filter(
    (o) => o.statusPesanan !== "selesai" && o.statusPesanan !== "dibatalkan"
  );

  // Group orders into KDS stages
  const queueMenunggu = activeOrders.filter(
    (o) => o.statusPesanan === "menunggu" || o.statusPesanan === "dikonfirmasi"
  );
  const queueMemasak = activeOrders.filter((o) => o.statusPesanan === "diproses");
  const queueSiap = activeOrders.filter((o) => o.statusPesanan === "siap_diambil");

  // Calculate Batch Pre-Order Cooking Summary
  const batchSummaryMap: Record<string, { namaMenu: string; totalQty: number; notes: string[] }> = {};
  queueMenunggu.concat(queueMemasak).forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((it) => {
        const key = it.namaMenuSnapshot || "Menu";
        if (!batchSummaryMap[key]) {
          batchSummaryMap[key] = {
            namaMenu: key,
            totalQty: 0,
            notes: [],
          };
        }
        batchSummaryMap[key].totalQty += it.jumlahPesanan || 1;
        if (it.catatanItem) {
          batchSummaryMap[key].notes.push(it.catatanItem);
        }
      });
    }
  });

  const batchSummaryList = Object.values(batchSummaryMap).sort((a, b) => b.totalQty - a.totalQty);
  const totalPortionsCooking = batchSummaryList.reduce((s, i) => s + i.totalQty, 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Top KDS Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold border border-orange-500/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Kitchen Display System (KDS)
                </h1>
                <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse uppercase">
                  Live Dapur
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPengelolaKantin && managedKantinNama
                  ? `Dapur Stand: ${managedKantinNama}`
                  : "Pantau antrean pesanan masak dan jadwal persiapan istirahat"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                soundEnabled
                  ? "bg-emerald-950/80 border-emerald-600/60 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? "Suara Aktif" : "Suara Hening"}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}</span>
            </button>
          </div>
        </div>

        {/* Schedule Filter Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            {JADWAL_FILTERS.map((f) => {
              const Icon = f.icon;
              const active = jadwalFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setJadwalFilter(f.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                    active
                      ? "bg-[#16a34a] text-white ring-2 ring-[#16a34a]/30"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowBatchSummary(!showBatchSummary)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
          >
            <ChefHat className="w-3.5 h-3.5 text-orange-500" />
            <span>{showBatchSummary ? "Tutup Rekap Dapur" : "Lihat Rekap Dapur"}</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded-full font-black">
              {totalPortionsCooking} porsi
            </span>
          </button>
        </div>

        {/* Collapsible Kitchen Batch Cooking Summary */}
        {showBatchSummary && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                  Rekap Masakan Dapur Yang Harus Disiapkan (Total: {totalPortionsCooking} Porsi)
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Koki dapat memasak sekaligus dalam satu wajan/batch
              </span>
            </div>

            {batchSummaryList.length === 0 ? (
              <p className="text-xs text-amber-800/80 italic py-1">
                Semua menu untuk jadwal ini telah selesai dimasak atau belum ada pesanan baru.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {batchSummaryList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-base font-black text-orange-600 leading-tight block">
                        {item.totalQty}x
                      </span>
                      <span className="text-xs font-bold text-gray-900 line-clamp-1 mt-0.5">
                        {item.namaMenu}
                      </span>
                    </div>
                    {item.notes.length > 0 && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded mt-1.5 truncate block">
                        Catatan: {item.notes[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3-Column KDS Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Menunggu Masak */}
          <div className="bg-gray-100/70 rounded-2xl p-3 border border-gray-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                  1. Perlu Dimasak ({queueMenunggu.length})
                </h2>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold">Antrean Baru</span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
              {queueMenunggu.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 font-semibold bg-white/60 rounded-xl border border-dashed border-gray-200">
                  Tidak ada pesanan menunggu
                </div>
              ) : (
                queueMenunggu.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-3.5 border-l-4 border-l-amber-500 border border-gray-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-gray-900 tracking-tight">
                        {order.nomorAntrean || order.kodePesanan}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {order.labelPengambilan || "Langsung"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 font-medium">
                      Pemesan: <strong className="text-gray-900">{order.namaPemesanSnapshot}</strong>
                    </div>

                    <div className="border-t border-gray-100 pt-2 space-y-1">
                      {order.items?.map((it, i) => (
                        <div key={i} className="flex items-start justify-between text-xs">
                          <span className="font-bold text-gray-900">
                            {it.jumlahPesanan}x {it.namaMenuSnapshot}
                          </span>
                          {it.catatanItem && (
                            <span className="text-[10px] text-orange-600 font-semibold">
                              ({it.catatanItem})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "diproses")}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Mulai Masak</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Sedang Dimasak */}
          <div className="bg-gray-100/70 rounded-2xl p-3 border border-gray-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                  2. Sedang Dimasak ({queueMemasak.length})
                </h2>
              </div>
              <span className="text-[10px] text-orange-600 font-semibold">Di Dapur</span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
              {queueMemasak.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 font-semibold bg-white/60 rounded-xl border border-dashed border-gray-200">
                  Dapur sedang santai
                </div>
              ) : (
                queueMemasak.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-3.5 border-l-4 border-l-orange-500 border border-gray-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-gray-900 tracking-tight">
                        {order.nomorAntrean || order.kodePesanan}
                      </span>
                      <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                        {order.labelPengambilan || "Langsung"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 font-medium">
                      Pemesan: <strong className="text-gray-900">{order.namaPemesanSnapshot}</strong>
                    </div>

                    <div className="border-t border-gray-100 pt-2 space-y-1">
                      {order.items?.map((it, i) => (
                        <div key={i} className="flex items-start justify-between text-xs">
                          <span className="font-bold text-gray-900">
                            {it.jumlahPesanan}x {it.namaMenuSnapshot}
                          </span>
                          {it.catatanItem && (
                            <span className="text-[10px] text-orange-600 font-semibold">
                              ({it.catatanItem})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, "siap_diambil")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Matang & Siap Diambil</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Siap Diambil di Etalase */}
          <div className="bg-gray-100/70 rounded-2xl p-3 border border-gray-200 space-y-3 flex flex-col">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                  3. Siap Diambil ({queueSiap.length})
                </h2>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">Di Etalase</span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
              {queueSiap.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 font-semibold bg-white/60 rounded-xl border border-dashed border-gray-200">
                  Belum ada pesanan di etalase
                </div>
              ) : (
                queueSiap.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-3.5 border-l-4 border-l-emerald-500 border border-gray-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-[#16a34a] tracking-tight">
                        {order.nomorAntrean || order.kodePesanan}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Siap Diambil
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 font-medium">
                      Pemesan: <strong className="text-gray-900">{order.namaPemesanSnapshot}</strong>
                    </div>

                    <div className="border-t border-gray-100 pt-2 space-y-1">
                      {order.items?.map((it, i) => (
                        <div key={i} className="flex items-start justify-between text-xs">
                          <span className="font-bold text-gray-900">
                            {it.jumlahPesanan}x {it.namaMenuSnapshot}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleSendWhatsApp(order)}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#16a34a] font-bold text-[11px] rounded-lg border border-emerald-200 transition flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(order.id, "selesai")}
                        className="py-1.5 px-2 bg-gray-900 hover:bg-black text-white font-bold text-[11px] rounded-lg transition flex items-center justify-center gap-1 active:scale-98"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Selesai</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
