"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Star,
  Minus,
  Plus,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { MenuItem, MenuReview } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";

const SIZES = [
  { name: "Regular", label: "Regular", extra: 0 },
  { name: "Jumbo", label: "Jumbo (+3rb)", extra: 3000 },
  { name: "Spesial", label: "Spesial (+5rb)", extra: 5000 },
];

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, updateQuantity, items } = useCart();
  const { userProfile } = useAuth();

  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("Regular");
  const [isLiked, setIsLiked] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<MenuReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const menuId = params.id as string;

  const loadReviews = async () => {
    const list = await DataService.getMenuReviews(menuId);
    setReviews(list);
  };

  useEffect(() => {
    async function loadItem() {
      const data = await DataService.getMenuById(menuId);
      setMenu(data);
      setLoading(false);
    }
    if (menuId) {
      loadItem();
      loadReviews();
    }
  }, [menuId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-[#f8faf8] p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Menu tidak ditemukan</h2>
        <Link href="/menu" className="text-sm font-semibold text-brand-600 underline">
          Kembali ke Daftar Menu
        </Link>
      </div>
    );
  }

  const isOutOfStock = menu.stok <= 0 || !menu.isAvailable;
  const currentSizeObj = SIZES.find((s) => s.name === selectedSize) || SIZES[0];
  const unitPrice = menu.hargaMenu + currentSizeObj.extra;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const modifiedMenu: MenuItem = {
      ...menu,
      namaMenu:
        selectedSize === "Regular" ? menu.namaMenu : `${menu.namaMenu} (${selectedSize})`,
      hargaMenu: unitPrice,
    };
    const res = addItem(modifiedMenu);
    if (!res.success && res.message) {
      setNotification(res.message);
    } else {
      setNotification(`✓ ${quantity}x ${modifiedMenu.namaMenu} ditambahkan ke keranjang!`);
      if (quantity > 1) {
        updateQuantity(modifiedMenu.id, quantity);
      }
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!userProfile) {
      setNotification("Silakan masuk akun terlebih dahulu untuk menulis ulasan.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setSubmittingReview(true);
    try {
      await DataService.addMenuReview({
        menuId,
        userId: userProfile.uid,
        userName: userProfile.namaPemesan,
        rating: newRating,
        komentar: newComment.trim(),
      });
      setNewComment("");
      setShowReviewForm(false);
      await loadReviews();
      setNotification("✓ Terima kasih! Ulasan Anda berhasil ditambahkan.");
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert("Gagal menambahkan ulasan: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-32">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-gray-700">
          <AlertCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Image Section */}
      <div className="relative w-full h-80 sm:h-96 bg-gray-200">
        <Image
          src={menu.gambarUrl}
          alt={menu.namaMenu}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />

        {/* Top Floating Action Icons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-gray-700 flex items-center justify-center shadow-md hover:bg-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white/90 backdrop-blur-md text-gray-700 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* Floating Rating Pill */}
        <div className="absolute -bottom-4 right-8 bg-[#ccf437] text-gray-900 px-3.5 py-1.5 rounded-full shadow-md font-extrabold text-xs flex items-center gap-1 z-10 border border-white">
          <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
          <span>4.9</span>
        </div>
      </div>

      {/* Main Details Container */}
      <div className="max-w-2xl mx-auto px-5 pt-8">
        {/* Title & Price Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {menu.kodeMenu} • {menu.kategori}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
              {menu.namaMenu}
            </h1>
            <p className="text-xl sm:text-2xl font-black text-brand-600 mt-1">
              {formatRupiah(unitPrice)}
            </p>
          </div>

          {/* Stepper (- 01 +) */}
          <div className="flex items-center gap-3 bg-gray-100/90 rounded-2xl p-1.5 border border-gray-200/60">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-8 h-8 rounded-xl bg-white text-gray-700 flex items-center justify-center shadow-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-extrabold text-gray-900 min-w-[20px] text-center">
              {String(quantity).padStart(2, "0")}
            </span>
            <button
              onClick={() => setQuantity(Math.min(menu.stok, quantity + 1))}
              disabled={quantity >= menu.stok || isOutOfStock}
              className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm disabled:opacity-40 hover:bg-brand-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stock Information Alert */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          {isOutOfStock ? (
            <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-xl">
              Stok Sedang Habis
            </span>
          ) : (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Tersedia • Stok sisa {menu.stok} porsi
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
            Deskripsi Menu
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            {menu.deskripsi}
          </p>
        </div>

        {/* Size Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Pilihan Porsi / Ukuran
          </h2>
          <div className="flex items-center gap-3">
            {SIZES.map((size) => (
              <button
                key={size.name}
                onClick={() => setSelectedSize(size.name)}
                className={`py-2 px-4 rounded-2xl text-xs font-extrabold transition-all ${
                  selectedSize === size.name
                    ? "bg-[#1b432a] text-white shadow-md scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Comments & Reviews */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Ulasan Mahasiswa {avgRating ? `(${avgRating}/5.0)` : `(${reviews.length})`}
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showReviewForm ? "Tutup Form" : "Tulis Ulasan"}</span>
            </button>
          </div>

          {/* Review Input Form */}
          {showReviewForm && (
            <form
              onSubmit={handleAddReview}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-card mb-4 space-y-3 animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Rating Bintang:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`text-lg transition ${
                        star <= newRating ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ceritakan rasa dan porsi menu ini..."
                  className="w-full text-xs p-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReview ? "Mengirim..." : "Kirim Ulasan"}</span>
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-xs text-gray-400">
                Belum ada ulasan untuk menu ini. Jadilah yang pertama memberikan ulasan!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-brand-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {rev.userName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {rev.userName}
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {formatTanggal(rev.createdAt)}
                      </span>
                    </div>
                    <div className="flex text-amber-400 text-xs my-0.5">
                      {"★".repeat(rev.rating)}
                      <span className="text-gray-200">{"★".repeat(5 - rev.rating)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {rev.komentar}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add to Cart Floating CTA */}
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-4 px-6 rounded-3xl font-extrabold text-sm sm:text-base flex items-center justify-between shadow-floating transition-all transform active:scale-95 ${
                isOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#1b432a] hover:bg-[#153621] text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-300" />
                {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </span>
              <span className="text-emerald-300">
                {formatRupiah(unitPrice * quantity)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
