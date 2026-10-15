"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import AppLogo from "@/components/ui/AppLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const { user, userProfile, loading: authLoading, login, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && (userProfile || user)) {
      if (userProfile?.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (redirectUrl) {
        router.replace(redirectUrl);
      } else {
        router.replace("/akun");
      }
    }
  }, [user, userProfile, authLoading, router, redirectUrl]);

  if (authLoading || (!authLoading && (userProfile || user))) {
    return (
      <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <AppLogo className="w-12 h-12 rounded-2xl shadow-sm" />
          <p className="text-xs font-semibold text-gray-500">Mengarahkan ke akun Anda...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const profile = await login(email, password);
      if (profile.role === "admin") {
        router.push("/admin/dashboard");
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/menu");
      }
    } catch (err: any) {
      setError(
        err.message?.includes("invalid-credential")
          ? "Email atau kata sandi tidak sesuai."
          : "Gagal masuk. Silakan periksa kembali akun Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    try {
      await resetPassword(resetEmail);
      setResetStatus("Email pemulihan kata sandi telah dikirim. Silakan periksa inbox Anda.");
    } catch (err) {
      setResetStatus("Gagal mengirim email reset. Pastikan email terdaftar.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-gray-100 animate-fade-in space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <AppLogo className="w-16 h-16 rounded-2xl shadow-floating" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Kantin Sekolah
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {redirectUrl === "/checkout"
              ? "Masuk akun terlebih dahulu untuk melanjutkan pesanan Anda"
              : "Masuk untuk memesan makanan atau kelola kantin"}
          </p>
        </div>

        {/* Notice if redirected from checkout */}
        {redirectUrl === "/checkout" && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#1b432a] text-xs font-semibold flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#1b432a] flex-shrink-0" />
            <span>Selesaikan login untuk melanjutkan pembayaran ke kantin.</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mahasiswa.ac.id atau admin@kantin.kampus"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Kata Sandi</label>
              <button
                type="button"
                onClick={() => setResetModal(true)}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1b432a] hover:bg-[#153621] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-floating transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Aplikasi"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Belum punya akun mahasiswa?{" "}
          <Link
            href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
            className="font-extrabold text-brand-600 hover:underline"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>

      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in">
            <h3 className="text-base font-extrabold text-gray-900">Reset Kata Sandi</h3>
            <p className="text-xs text-gray-500">
              Masukkan alamat email Anda untuk menerima tautan pemulihan sandi.
            </p>
            {resetStatus && (
              <p className="text-xs font-semibold text-brand-700 bg-brand-50 p-2.5 rounded-xl">
                {resetStatus}
              </p>
            )}
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="nama@mahasiswa.ac.id"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setResetModal(false)}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <AppLogo className="w-12 h-12 rounded-2xl shadow-sm" />
            <p className="text-xs font-semibold text-gray-500">Memuat halaman login...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
