export type UserRole = "admin" | "pemesan";

export interface UserProfile {
  uid: string;
  kodePemesan: string; // e.g. P001
  namaPemesan: string;
  noTlp: string;
  alamatPemesan: string;
  email: string;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
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

export type PaymentMethod = "QRIS" | "tunai";

export type PaymentStatus = "menunggu" | "berhasil" | "gagal" | "dikembalikan";

export interface OrderItem {
  menuId: string;
  namaMenuSnapshot: string;
  hargaMenuSnapshot: number;
  jumlahPesanan: number;
  subtotalItem: number;
  gambarUrlSnapshot: string;
  sizeOption?: string;
}

export interface Order {
  id: string;
  kodePesanan: string; // e.g. B001
  pemesanId: string;
  namaPemesanSnapshot: string;
  kantinId: string;
  namaKantinSnapshot: string;
  tanggalPemesanan: any;
  statusPesanan: OrderStatus;
  metodeTransaksi: PaymentMethod;
  statusTransaksi: PaymentStatus;
  subtotal: number;
  totalHarga: number;
  catatan?: string;
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
}

export interface MenuReview {
  id: string;
  menuId: string;
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
