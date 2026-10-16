"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Store,
  QrCode,
  Banknote,
  AlertTriangle,
  XCircle,
  Receipt,
  CheckCircle2,
  Star,
  MessageSquare,
  Send,
  Check,
  X,
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Order, OrderStatus, MenuReview } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

const STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: "menunggu", label: "Menunggu Konfirmasi", desc: "Pesanan masuk ke kasir kantin" },
  { status: "dikonfirmasi", label: "Dikonfirmasi", desc: "Pesanan diterima oleh pihak kantin" },
  { status: "diproses", label: "Sedang Dimasak", desc: "Makanan sedang disiapkan di dapur" },
  { status: "siap_diambil", label: "Siap Diambil", desc: "Silakan ke kasir kantin mengambil pesanan" },
  { status: "selesai", label: "Pesanan Selesai", desc: "Pesanan telah selesai dan diserahkan" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  // Review states
  const [orderReviews, setOrderReviews] = useState<MenuReview[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const orderId = params.id as string;

  const loadOrder = async () => {
    const data = await DataService.getOrderById(orderId);
    setOrder(data);
    setLoading(false);
    if (data?.id) {
      const revs = await DataService.getReviewsByPesananId(data.id);
      setOrderReviews(revs);
    }
  };

  useEffect(() => {
    if (orderId) {
      const unsubscribe = DataService.subscribeOrder(orderId, (updatedOrder) => {
        setOrder(updatedOrder);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8faf8] p-6 text-center flex flex-col items-center justify-center">
        <h2 className="text-base font-bold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
        <Link href="/pesanan-saya" className="text-xs font-semibold text-[#16a34a] hover:underline">
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

  const handleSubmitReview = async () => {
    if (!order || !userProfile) return;
    setSubmittingReview(true);
    try {
      const itemsToReview = order.items && order.items.length > 0 ? order.items : [];
      for (const it of itemsToReview) {
        await DataService.addMenuReview({
          menuId: it.menuId,
          pesananId: order.id,
          userId: userProfile.uid,
          userName: userProfile.namaPemesan || "Mahasiswa",
          rating: ratingStars,
          komentar: reviewComment.trim() || "Makanannya enak dan porsi memuaskan!",
        });
      }
      setReviewSuccess(true);
      const revs = await DataService.getReviewsByPesananId(order.id);
      setOrderReviews(revs);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 1000);
    } catch (e) {
      console.error("Gagal submit review:", e);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/70 px-4 h-14 flex items-center justify-between max-w-xl mx-auto">
        <Link
          href="/pesanan-saya"
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm sm:text-base font-extrabold text-gray-900">
          Status Antrean Pesanan
        </h1>
        <div className="w-8" />
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-3.5">
        {/* Digital Queue Ticket Card (Clean GoFood / GrabFood Pickup Ticket Style) */}
        <section aria-label="Tiket Antrean Pesanan" className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs text-center space-y-2 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16a34a] border border-emerald-200/60">
            <Receipt className="w-3.5 h-3.5" />
            <span>Nomor Antrean Anda</span>
          </div>

          <div className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 py-1">
            {order.nomorAntrean || `A-${order.kodePesanan.slice(-2)}`}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 font-medium">
            <span>Kode: <strong className="text-gray-800">{order.kodePesanan}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Est. Saji: ~{order.estimasiMenit || 15} Menit
            </span>
          </div>

          {order.labelPengambilan && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Waktu Ambil: {order.labelPengambilan}</span>
            </div>
          )}

          <div className="pt-2 text-xs text-gray-400 border-t border-gray-100">
            Sebutkan nomor antrean saat mengambil pesanan di kasir <strong className="text-gray-700">{order.namaKantinSnapshot}</strong>
          </div>
        </section>

        {/* Real-time Order Tracking Stepper */}
        <section aria-label="Pelacakan Pesanan Real-time" className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Status Pemrosesan Pesanan
          </h2>

          {order.statusPesanan === "dibatalkan" ? (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2.5 text-red-700 text-xs">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Pesanan Dibatalkan</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Stok menu telah dikembalikan otomatis ke persediaan kantin.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition ${
                        isCurrent
                          ? "bg-[#16a34a] border-white ring-3 ring-emerald-100"
                          : isPassed
                          ? "bg-[#16a34a] border-white text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isPassed && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-[#16a34a]"
                            : isPassed
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Order Details & Summary */}
        <section aria-label="Rincian Pesanan dan Pembayaran" className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Kantin</span>
              <p className="text-xs font-bold text-gray-900">{order.namaKantinSnapshot}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Waktu Pesan</span>
              <p className="text-xs font-semibold text-gray-600">{formatTanggal(order.createdAt)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Item Dipesan
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex items-start justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#16a34a]">{item.jumlahPesanan}x</span>
                      <span className="font-semibold text-gray-900">{item.namaMenuSnapshot}</span>
                    </div>
                    {item.catatanItem && (
                      <p className="text-[10px] text-gray-400 italic pl-5 mt-0.5">
                        Catatan: {item.catatanItem}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 whitespace-nowrap">
                    {formatRupiah(item.subtotalItem)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {order.catatan && (
            <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-600">
              <span className="font-bold text-gray-800">Catatan:</span> {order.catatan}
            </div>
          )}

          {/* Payment Status Bar */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Metode Pembayaran</span>
              <span className="font-bold text-gray-800 uppercase flex items-center gap-1">
                {order.metodeTransaksi === "QRIS" ? (
                  <QrCode className="w-3.5 h-3.5 text-[#16a34a]" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                )}
                {order.metodeTransaksi}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status Pembayaran</span>
              <span
                className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-md ${
                  order.statusTransaksi === "berhasil"
                    ? "bg-emerald-100 text-emerald-800"
                    : order.statusTransaksi === "menunggu"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.statusTransaksi}
              </span>
            </div>
            <div className="border-t border-gray-200/80 pt-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Menu</span>
                <span className="font-semibold text-gray-900">{formatRupiah(order.subtotal || order.totalHarga)}</span>
              </div>
              {order.diskonVoucher && order.diskonVoucher > 0 && (
                <div className="flex justify-between text-[#16a34a] font-bold">
                  <span>Diskon Kupon ({order.kodeVoucher || "Voucher"})</span>
                  <span>-{formatRupiah(order.diskonVoucher)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-gray-200/60">
                <span className="text-gray-900">Total Pembayaran</span>
                <span className="text-[#16a34a] font-extrabold">
                  {formatRupiah(order.totalHarga)}
                </span>
              </div>
            </div>
          </div>

          {/* Rating & Review Section for Completed Order */}
          {order.statusPesanan === "selesai" && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Ulasan Makanan</span>
                </div>
                {orderReviews.length > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Sudah Diulas
                  </span>
                )}
              </div>

              {orderReviews.length > 0 ? (
                <div className="p-2.5 bg-white rounded-lg border border-amber-100 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                    {"★".repeat(orderReviews[0].rating)}
                    <span className="text-gray-300">{"★".repeat(5 - orderReviews[0].rating)}</span>
                    <span className="text-gray-600 text-xs ml-1 font-semibold">({orderReviews[0].rating}/5)</span>
                  </div>
                  <p className="text-gray-600 italic text-[11px]">
                    &ldquo;{orderReviews[0].komentar}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-amber-900 leading-tight">
                    Bagaimana rasa makanannya? Beri bintang & ulasan untuk kantin!
                  </p>
                  <button
                    onClick={() => {
                      setRatingStars(5);
                      setReviewComment("");
                      setShowReviewModal(true);
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-lg transition shadow-2xs whitespace-nowrap"
                  >
                    Beri Ulasan ⭐
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cancel button if order still waiting */}
          {order.statusPesanan === "menunggu" && (
            <div className="pt-1">
              <button
                onClick={() => setCancelModal(true)}
                className="w-full py-2.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition"
              >
                Batalkan Pesanan
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Ulasan Menu</h3>
                  <p className="text-[10px] text-gray-400">Bagikan penilaian Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[#16a34a] mx-auto" />
                <h4 className="text-xs font-bold text-emerald-900">Ulasan Terkirim!</h4>
                <p className="text-[11px] text-emerald-700">Terima kasih telah membantu kantin menjadi lebih baik.</p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-gray-700">Beri Bintang:</span>
                  <div className="flex justify-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingStars(star)}
                        className={`text-2xl transition hover:scale-110 ${
                          star <= ratingStars ? "text-amber-400" : "text-gray-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    {ratingStars === 5
                      ? "Luar Biasa Enak! 😍"
                      : ratingStars === 4
                      ? "Enak Banget 👍"
                      : ratingStars === 3
                      ? "Cukup Baik 🙂"
                      : "Perlu Peningkatan"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Komentar Rasa / Porsi
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Contoh: Bumbu meresap, ayamnya crispy, es teh pas manisnya..."
                    className="w-full text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-[#16a34a] hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReview ? "Mengirim..." : "Kirim Ulasan Sekarang"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center space-y-3 animate-fade-in border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Batalkan Pesanan?</h3>
            <p className="text-xs text-gray-500">
              Yakin ingin membatalkan pesanan ini? Stok menu akan dikembalikan secara otomatis.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCancelModal(false)}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                {cancelling ? "Batal..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
