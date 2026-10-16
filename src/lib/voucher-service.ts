import { Voucher } from "@/types";

export const AVAILABLE_VOUCHERS: Voucher[] = [
  {
    kode: "JUMATBERKAH",
    tipe: "nominal",
    nilai: 5000,
    minBelanja: 15000,
    deskripsi: "Potongan Rp 5.000 dengan minimal belanja Rp 15.000",
  },
  {
    kode: "HEMAT10",
    tipe: "persen",
    nilai: 10,
    minBelanja: 20000,
    maxDiskon: 6000,
    deskripsi: "Diskon 10% (maksimal Rp 6.000) minimal belanja Rp 20.000",
  },
  {
    kode: "MABARU",
    tipe: "nominal",
    nilai: 3000,
    minBelanja: 10000,
    deskripsi: "Diskon Rp 3.000 khusus mahasiswa baru minimal Rp 10.000",
  },
  {
    kode: "KANTINJUARA",
    tipe: "nominal",
    nilai: 4000,
    minBelanja: 12000,
    deskripsi: "Hemat Rp 4.000 belanja minimal Rp 12.000",
  },
];

export function validateVoucher(
  code: string,
  subtotal: number
): { valid: boolean; voucher?: Voucher; discount: number; message: string } {
  const cleanCode = code.trim().toUpperCase();
  const voucher = AVAILABLE_VOUCHERS.find((v) => v.kode === cleanCode);

  if (!voucher) {
    return {
      valid: false,
      discount: 0,
      message: `Kode voucher "${code}" tidak ditemukan.`,
    };
  }

  if (subtotal < voucher.minBelanja) {
    return {
      valid: false,
      discount: 0,
      message: `Minimal belanja untuk voucher ini adalah Rp ${voucher.minBelanja.toLocaleString("id-ID")}.`,
    };
  }

  let discount = 0;
  if (voucher.tipe === "nominal") {
    discount = voucher.nilai;
  } else if (voucher.tipe === "persen") {
    discount = Math.round((subtotal * voucher.nilai) / 100);
    if (voucher.maxDiskon && discount > voucher.maxDiskon) {
      discount = voucher.maxDiskon;
    }
  }

  // Ensure discount doesn't exceed subtotal
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    voucher,
    discount,
    message: `Voucher ${voucher.kode} berhasil dipasang! Hemat Rp ${discount.toLocaleString("id-ID")}`,
  };
}
