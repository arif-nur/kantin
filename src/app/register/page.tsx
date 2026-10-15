"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, Phone, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import AppLogo from "@/components/ui/AppLogo";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [nama, setNama] = useState("");
  const [noTlp, setNoTlp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !password || !noTlp || !alamat) {
      setError("Semua kolom formulir wajib diisi.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        nama,
        email,
        password,
        noTlp,
        alamat,
      });
      router.push("/menu");
    } catch (err: any) {
      setError(err.message || "Gagal melakukan registrasi akun mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] flex items-center justify-center p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-gray-100 animate-fade-in space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <AppLogo className="w-16 h-16 rounded-2xl shadow-floating" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Daftar Akun Mahasiswa
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Buat akun untuk memesan makanan kantin kampus dengan praktis
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Siti Rahma"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  value={noTlp}
                  onChange={(e) => setNoTlp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Jurusan / Lokasi
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Teknik Informatika (Sem 5)"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Alamat Email Mahasiswa
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mahasiswa.ac.id"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 digit"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Konfirmasi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1b432a] hover:bg-[#153621] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-floating transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Mendaftarkan Akun..." : "Daftar Akun Sekarang"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-extrabold text-brand-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
