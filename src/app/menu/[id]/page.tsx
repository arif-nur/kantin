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
  Store,
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { MenuItem, MenuReview } from "@/types";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";

const SIZES = [
  { name: "Regular", label: "Porsi Regular", extra: 0 },
  { name: "Jumbo", label: "Porsi Jumbo (+3rb)", extra: 3000 },
  { name: "Spesial", label: "Porsi Spesial (+5rb)", extra: 5000 },
];

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, updateQuantity } = useCart();
  const { userProfile } = useAuth();

  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [canteenName, setCanteenName] = useState<string>("Kantin Kampus");
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
      if (data?.kantinId) {
        const kList = await DataService.getKantinList();
        const found = kList.find((k) => k.id === data.kantinId);
        if (found) setCanteenName(found.namaKantin);
      }
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
        <div className="w-8 h-8 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-[#f8faf8] p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-base font-bold text-gray-800 mb-2">Menu tidak ditemukan</h2>
        <Link href="/menu" className="text-xs font-semibold text-[#16a34a] hover:underline">
          Kembali ke Katalog Menu
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
    const res = addItem(modifiedMenu, canteenName);
    if (!res.success && res.message) {
      setNotification(res.message);
    } else {
      setNotification(`✓ ${quantity}x ${modifiedMenu.namaMenu} ditambahkan`);
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
      setNotification("✓ Terima kasih atas ulasannya!");
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in border border-gray-800">
          <AlertCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Image Section with Native App Controls */}
      <div className="relative w-full h-72 sm:h-96 bg-gray-200">
        <Image
          src={menu.gambarUrl}
          alt={menu.namaMenu}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Action Icons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-gray-800 flex items-center justify-center shadow-sm hover:bg-white transition active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition active:scale-95 ${
              isLiked
                ? "bg-red-500 text-white"
                : "bg-white/95 backdrop-blur-md text-gray-700 hover:text-red-500"
            }`}
            aria-label="Favorit"
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Details Container */}
      <main className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* Canteen Tag & Category */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
              <Store className="w-3.5 h-3.5 text-[#16a34a]" />
              {canteenName}
            </span>
            <span className="text-gray-400 font-medium">
              {menu.kategori}
            </span>
          </div>

          {/* Title & Price Header */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
              {menu.namaMenu}
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xl sm:text-2xl font-black text-[#16a34a]">
                {formatRupiah(unitPrice)}
              </span>
              {avgRating && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{avgRating} ({reviews.length})</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div className="pt-2 border-t border-gray-100">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                Stok Sedang Habis
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Tersedia • Sisa {menu.stok} porsi
              </span>
            )}
          </div>

          {/* Description */}
          <div className="pt-2">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
              Deskripsi Menu
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {menu.deskripsi || "Menu lezat dan higienis dari kantin kampus."}
            </p>
          </div>

          {/* Size / Portion Selection (GoFood Option Style) */}
          <div className="pt-3 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
              Pilihan Porsi
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition text-center border ${
                    selectedSize === size.name
                      ? "bg-[#16a34a] text-white border-[#16a34a] shadow-2xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="truncate">{size.name}</div>
                  <div className={`text-[10px] font-normal mt-0.5 ${selectedSize === size.name ? "text-emerald-100" : "text-gray-400"}`}>
                    {size.extra === 0 ? "Standar" : `+${formatRupiah(size.extra)}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Ulasan Mahasiswa {avgRating ? `(${avgRating} / 5.0)` : ""}
            </h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-xs font-bold text-[#16a34a] hover:underline flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showReviewForm ? "Batal" : "Tulis Ulasan"}</span>
            </button>
          </div>

          {/* Review Input Form */}
          {showReviewForm && (
            <form
              onSubmit={handleAddReview}
              className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/70 space-y-3 animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Rating:</span>
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

              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Bagikan pendapat Anda tentang rasa dan porsi menu ini..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#16a34a] bg-white text-gray-900"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="py-1.5 px-3.5 bg-[#16a34a] hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{submittingReview ? "Mengirim..." : "Kirim Ulasan"}</span>
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Belum ada ulasan untuk menu ini. Jadilah yang pertama memberikan ulasan!
              </p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">{rev.userName}</span>
                    <span className="text-[10px] text-gray-400">{formatTanggal(rev.createdAt)}</span>
                  </div>
                  <div className="text-amber-400 text-xs my-0.5">
                    {"★".repeat(rev.rating)}
                    <span className="text-gray-200">{"★".repeat(5 - rev.rating)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {rev.komentar}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (GoFood Style) */}
      <aside aria-label="Aksi Tambah Pesanan" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Stepper */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200/70 flex-shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="w-8 h-8 rounded-lg bg-white text-gray-700 flex items-center justify-center shadow-xs disabled:opacity-40 hover:bg-gray-50 transition"
              title="Kurang"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-extrabold text-gray-900 w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(menu.stok, quantity + 1))}
              disabled={quantity >= menu.stok || isOutOfStock}
              className="w-8 h-8 rounded-lg bg-[#16a34a] text-white flex items-center justify-center shadow-xs disabled:opacity-40 hover:bg-emerald-700 transition"
              title="Tambah"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition shadow-xs active:scale-98 ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#16a34a] hover:bg-emerald-700 text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}</span>
            </span>
            <span className="font-extrabold">
              {formatRupiah(unitPrice * quantity)}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
