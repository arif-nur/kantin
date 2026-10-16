export type UserRole = "admin" | "pengelola_kantin" | "pemesan";

export interface UserProfile {
  uid: string;
  kodePemesan: string; // e.g. P001
  namaPemesan: string;
  noTlp: string;
  alamatPemesan: string;
  email: string;
  role: UserRole;
  kantinId?: string; // ID kantin yang dikelola jika role = 'pengelola_kantin'
  namaKantinKelola?: string; // Nama kantin yang dikelola
  saldoKantin?: number; // Saldo KantinPay mahasiswa (dalam Rupiah)
  createdAt: any;
  updatedAt: any;
}

export interface SaldoMutation {
  id: string;
  userId: string;
  tipe: "topup" | "pembayaran" | "refund";
  jumlah: number;
  saldoSebelum: number;
  saldoSesudah: number;
  keterangan: string;
  createdAt: any;
}

export interface Kantin {
  id: string;
  kodeKantin: string;
  namaKantin: string;
  alamatKantin: string;
  noTlpKantin: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface MenuItem {
  id: string;
  kodeMenu: string; // e.g. A001
  namaMenu: string;
  deskripsi: string;
  kategori: string;
  hargaMenu: number; // integer rupiah
  stok: number;
  gambarUrl: string;
  cloudinaryPublicId?: string;
  kantinId: string;
  isAvailable: boolean;
  estimasiMenit?: number;
  ratingRataRata?: number;
  totalUlasan?: number;
  createdAt: any;
  updatedAt: any;
}

export type OrderStatus =
  | "menunggu"
  | "dikonfirmasi"
  | "diproses"
  | "siap_diambil"
  | "selesai"
  | "dibatalkan";

export type PaymentMethod = "QRIS" | "tunai" | "KantinPay";

export type PaymentStatus = "menunggu" | "berhasil" | "gagal" | "dikembalikan";

export type JadwalPengambilan = "langsung" | "istirahat_1" | "istirahat_2" | "kustom";

export interface OrderItem {
  menuId: string;
  namaMenuSnapshot: string;
  hargaMenuSnapshot: number;
  jumlahPesanan: number;
  subtotalItem: number;
  gambarUrlSnapshot: string;
  sizeOption?: string;
  catatanItem?: string;
}

export interface Order {
  id: string;
  kodePesanan: string; // e.g. B001
  nomorAntrean?: string; // e.g. A-01, A-02
  pemesanId: string;
  namaPemesanSnapshot: string;
  kantinId: string;
  namaKantinSnapshot: string;
  tanggalPemesanan: any;
  statusPesanan: OrderStatus;
  metodeTransaksi: PaymentMethod;
  statusTransaksi: PaymentStatus;
  subtotal: number;
  diskonVoucher?: number;
  kodeVoucher?: string;
  totalHarga: number;
  catatan?: string;
  buktiBayarUrl?: string;
  estimasiMenit?: number;
  jadwalPengambilan?: JadwalPengambilan;
  labelPengambilan?: string;
  createdAt: any;
  updatedAt: any;
  items?: OrderItem[];
}

export interface Transaction {
  id: string;
  kodeTransaksi: string; // e.g. C001
  pesananId: string;
  pemesanId: string;
  metodeTransaksi: PaymentMethod;
  statusTransaksi: PaymentStatus;
  jumlahPembayaran: number;
  referensiPembayaran?: string;
  waktuPembayaran?: any;
  createdAt: any;
  updatedAt: any;
}

export interface CartItem {
  menu: MenuItem;
  quantity: number;
  sizeOption?: string;
  additionalPrice?: number;
  catatanItem?: string;
}

export interface Voucher {
  kode: string;
  tipe: "nominal" | "persen";
  nilai: number;
  minBelanja: number;
  maxDiskon?: number;
  deskripsi: string;
}

export interface MenuReview {
  id: string;
  menuId: string;
  pesananId?: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  komentar: string;
  createdAt: any;
}

export interface KantinSettings {
  jamBuka: string; // e.g. "07:00"
  jamTutup: string; // e.g. "15:00"
  isStoreOpenManual: boolean;
  pesanTutup?: string;
  updatedAt?: any;
}
