"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  LogOut,
  Edit3,
  Check,
  AlertCircle,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import StudentBottomNav from "@/components/navigation/StudentBottomNav";

export default function AkunPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, logout, updateProfile, resetPassword, isAdmin } = useAuth();
  const { totalItems } = useCart();

  const [isEditing, setIsEditing] = useState(false);
  const [namaPemesan, setNamaPemesan] = useState("");
  const [noTlp, setNoTlp] = useState("");
  const [alamatPemesan, setAlamatPemesan] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNamaPemesan(userProfile.namaPemesan || "");
      setNoTlp(userProfile.noTlp === "-" ? "" : userProfile.noTlp || "");
      setAlamatPemesan(userProfile.alamatPemesan === "-" ? "" : userProfile.alamatPemesan || "");
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPemesan.trim()) {
      setSaveError("Nama lengkap tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateProfile({
        namaPemesan: namaPemesan.trim(),
        noTlp: noTlp.trim() || "-",
        alamatPemesan: alamatPemesan.trim() || "-",
      });
      setSaveSuccess("Data profil Anda berhasil disimpan!");
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userProfile?.email) return;
    setResettingPassword(true);
    setResetMessage(null);
    try {
      await resetPassword(userProfile.email);
      setResetMessage(`Tautan ubah sandi telah dikirim ke ${userProfile.email}. Silakan periksa kotak masuk atau spam Anda.`);
    } catch (err: any) {
      setResetMessage("Gagal mengirim email reset kata sandi. Coba beberapa saat lagi.");
    } finally {
      setResettingPassword(false);
    }
  };

  // State: Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] pb-24">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-10" />
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
          <div className="h-36 bg-white rounded-3xl animate-pulse shadow-sm" />
          <div className="h-44 bg-white rounded-3xl animate-pulse shadow-sm" />
          <div className="h-32 bg-white rounded-3xl animate-pulse shadow-sm" />
        </main>
        <StudentBottomNav />
      </div>
    );
  }

  // State: Not logged in
  if (!user && !userProfile) {
    return (
      <div className="min-h-screen bg-[#f8faf8] pb-28">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
          <Link
            href="/menu"
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
            Akun Pengguna
          </h1>
          <div className="w-10" />
        </header>

        <main className="max-w-md mx-auto px-4 pt-10 text-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-100 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-brand-600 flex items-center justify-center shadow-inner">
              <User className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-lg font-black text-gray-900">Belum Masuk Akun</h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Masuk ke akun Anda untuk melihat status pesanan aktif, riwayat transaksi, dan mempermudah pemesanan menu kantin sekolah.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/login"
                className="w-full py-3 px-4 bg-[#1b432a] hover:bg-[#153621] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-floating transition flex items-center justify-center gap-2"
              >
                <span>Masuk ke Akun</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs sm:text-sm rounded-2xl border border-gray-200 transition block text-center"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </main>

        <StudentBottomNav />
      </div>
    );
  }

  // State: Logged in
  const initial = userProfile?.namaPemesan?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#f8faf8] pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto">
        <Link
          href="/menu"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
          Akun & Profil Saya
        </h1>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title="Keluar dari akun"
          className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4 animate-fade-in">
        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Hero User Profile Card */}
        <div className="bg-gradient-to-br from-[#1b432a] to-[#122e1d] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-inner">
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold truncate">
                  {userProfile?.namaPemesan || "Pengguna Kantin"}
                </h2>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Siswa / Pemesan
                  </span>
                )}
              </div>

              <p className="text-xs text-emerald-100/80 truncate mt-0.5">
                {userProfile?.email}
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-200 border border-white/10">
                <span>Kode Pemesan:</span>
                <span className="tracking-wider font-extrabold text-white">
                  {userProfile?.kodePemesan || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/pesanan-saya"
            className="bg-white rounded-3xl p-4 shadow-card border border-gray-100 hover:shadow-md transition flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition">
                Pesanan Saya
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                Cek status order
              </div>
            </div>
          </Link>

          <Link
            href="/keranjang"
            className="bg-white rounded-3xl p-4 shadow-card border border-gray-100 hover:shadow-md transition flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-emerald-50 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition">
                Keranjang
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {totalItems > 0 ? `${totalItems} menu menunggu` : "Kosong"}
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Dashboard shortcut if admin */}
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>Panel Pengelola Kantin (Admin)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Kelola menu, pesanan masuk, laporan penjualan, & data kantin
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-sm group-hover:translate-x-1 transition">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Profile Information & Edit Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Data Pribadi
              </h3>
              <p className="text-[11px] text-gray-400">
                Informasi untuk identifikasi pesanan makanan
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                  if (userProfile) {
                    setNamaPemesan(userProfile.namaPemesan || "");
                    setNoTlp(userProfile.noTlp === "-" ? "" : userProfile.noTlp || "");
                    setAlamatPemesan(userProfile.alamatPemesan === "-" ? "" : userProfile.alamatPemesan || "");
                  }
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-xl bg-gray-100"
              >
                Batal
              </button>
            )}
          </div>

          {saveError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-400">Nama Lengkap</div>
                  <div className="text-xs sm:text-sm font-bold text-gray-800">
                    {userProfile?.namaPemesan || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-400">Nomor WhatsApp / HP</div>
                  <div className="text-xs sm:text-sm font-bold text-gray-800">
                    {userProfile?.noTlp && userProfile.noTlp !== "-" ? userProfile.noTlp : "Belum diisi"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-400">Kelas / Jurusan / Lokasi</div>
                  <div className="text-xs sm:text-sm font-bold text-gray-800">
                    {userProfile?.alamatPemesan && userProfile.alamatPemesan !== "-" ? userProfile.alamatPemesan : "Belum diisi"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-400">Email Akun</div>
                  <div className="text-xs sm:text-sm font-bold text-gray-800">
                    {userProfile?.email || "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={namaPemesan}
                    onChange={(e) => setNamaPemesan(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={noTlp}
                    onChange={(e) => setNoTlp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kelas / Jurusan / Lokasi Pengambilan
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={alamatPemesan}
                    onChange={(e) => setAlamatPemesan(e.target.value)}
                    placeholder="Contoh: XII IPA 2 / Ruang 304"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security & Password reset */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-3">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
              Keamanan & Kata Sandi
            </h3>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Ingin memperbarui kata sandi akun? Tautan reset kata sandi resmi akan dikirim langsung ke alamat email terdaftar Anda.
          </p>

          {resetMessage && (
            <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold animate-fade-in">
              {resetMessage}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={resettingPassword}
            className="py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>{resettingPassword ? "Mengirim..." : "Kirim Tautan Reset Sandi"}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs sm:text-sm rounded-2xl border border-red-100 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-gray-900">
                Keluar dari Akun?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Anda perlu masuk kembali untuk mengakses pesanan dan data akun Anda.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
                className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <StudentBottomNav />
    </div>
  );
}
