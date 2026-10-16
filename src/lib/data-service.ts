import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase/client";
import {
  Kantin,
  MenuItem,
  Order,
  OrderItem,
  Transaction,
  UserProfile,
  UserRole,
  MenuReview,
  KantinSettings,
  SaldoMutation,
  PaymentMethod,
  JadwalPengambilan,
} from "@/types";

export const DataService = {
  // Clear any legacy demo data from localStorage
  async initIfEmpty() {
    if (typeof window === "undefined") return;
    const legacyKeys = [
      "kantin_data_initialized",
      "kantin_data_kantin",
      "kantin_data_menu",
      "kantin_data_orders",
      "kantin_data_users",
      "kantin_data_transactions",
      "demo_user",
    ];
    legacyKeys.forEach((key) => localStorage.removeItem(key));
  },

  // ================= USERS =================
  async getUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile));
    } catch (e) {
      console.error("Gagal mengambil data users dari Firestore:", e);
      return [];
    }
  },

  async updateUserRole(uid: string, role: UserRole) {
    try {
      await updateDoc(doc(db, "users", uid), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Gagal mengubah role user di Firestore:", e);
      throw e;
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    try {
      const payload: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      delete payload.uid;
      await updateDoc(doc(db, "users", uid), payload);
    } catch (e) {
      console.error("Gagal mengubah profil user di Firestore:", e);
      throw e;
    }
  },

  // ================= KANTIN =================
  async getKantinList(): Promise<Kantin[]> {
    try {
      const snap = await getDocs(collection(db, "kantin"));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Kantin));
    } catch (e) {
      console.error("Gagal mengambil data kantin dari Firestore:", e);
      return [];
    }
  },

  async createKantin(data: Omit<Kantin, "id" | "createdAt" | "updatedAt">): Promise<Kantin> {
    const kantinRef = doc(collection(db, "kantin"));
    const newKantin: Kantin = {
      ...data,
      id: kantinRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(kantinRef, {
      ...newKantin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newKantin;
  },

  async updateKantin(id: string, data: Partial<Kantin>) {
    await updateDoc(doc(db, "kantin", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteKantin(id: string) {
    await deleteDoc(doc(db, "kantin", id));
  },

  // ================= MENU =================
  async getMenuList(kantinId?: string): Promise<MenuItem[]> {
    try {
      let q = collection(db, "menu");
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MenuItem));
      if (kantinId && kantinId !== "semua") {
        list = list.filter((m) => m.kantinId === kantinId);
      }
      return list;
    } catch (e) {
      console.error("Gagal mengambil menu dari Firestore:", e);
      return [];
    }
  },

  async getMenuById(id: string): Promise<MenuItem | null> {
    try {
      const snap = await getDoc(doc(db, "menu", id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as MenuItem;
      }
      return null;
    } catch (e) {
      console.error("Gagal mengambil detail menu:", e);
      return null;
    }
  },

  async createMenu(data: Omit<MenuItem, "id" | "createdAt" | "updatedAt">): Promise<MenuItem> {
    const menuRef = doc(collection(db, "menu"));
    const newMenu: MenuItem = {
      ...data,
      id: menuRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(menuRef, {
      ...newMenu,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newMenu;
  },

  async updateMenu(id: string, data: Partial<MenuItem>) {
    await updateDoc(doc(db, "menu", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteMenu(id: string, cloudinaryPublicId?: string) {
    if (cloudinaryPublicId) {
      try {
        await fetch("/api/cloudinary-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: cloudinaryPublicId, role: "admin" }),
        });
      } catch (e) {
        console.warn("Cloudinary delete call skipped", e);
      }
    }

    await deleteDoc(doc(db, "menu", id));
  },

  async toggleMenuAvailability(id: string, isAvailable: boolean) {
    await updateDoc(doc(db, "menu", id), {
      isAvailable,
      updatedAt: serverTimestamp(),
    });
  },

  // ================= PESANAN & TRANSAKSI =================
  async getOrders(filter?: {
    pemesanId?: string;
    kantinId?: string;
    status?: string;
  }): Promise<Order[]> {
    try {
      const snap = await getDocs(collection(db, "pesanan"));
      let list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));

      if (filter?.pemesanId) {
        list = list.filter((o) => o.pemesanId === filter.pemesanId);
      }
      if (filter?.kantinId && filter.kantinId !== "semua") {
        list = list.filter((o) => o.kantinId === filter.kantinId);
      }
      if (filter?.status && filter.status !== "semua") {
        list = list.filter((o) => o.statusPesanan === filter.status);
      }

      return list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } catch (e) {
      console.error("Gagal mengambil pesanan dari Firestore:", e);
      return [];
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const snap = await getDoc(doc(db, "pesanan", id));
      if (snap.exists()) {
        const order = { ...snap.data(), id: snap.id } as Order;
        const itemsSnap = await getDocs(collection(db, "pesanan", id, "items"));
        if (!itemsSnap.empty) {
          order.items = itemsSnap.docs.map((d) => d.data() as OrderItem);
        }
        return order;
      }
      return null;
    } catch (e) {
      console.error("Gagal mengambil detail pesanan:", e);
      return null;
    }
  },

  async updateOrderStatus(
    orderId: string,
    statusPesanan: Order["statusPesanan"],
    statusTransaksi?: Order["statusTransaksi"]
  ) {
    const effectiveTrxStatus =
      statusTransaksi ||
      (statusPesanan === "selesai" ? "berhasil" : statusPesanan === "dibatalkan" ? "gagal" : undefined);

    const updatePayload: any = {
      statusPesanan,
      updatedAt: serverTimestamp(),
    };
    if (effectiveTrxStatus) {
      updatePayload.statusTransaksi = effectiveTrxStatus;
    }

    await updateDoc(doc(db, "pesanan", orderId), updatePayload);

    // Sync corresponding transaction document in Firestore
    if (effectiveTrxStatus) {
      try {
        const trxQuery = query(collection(db, "transaksi"), where("pesananId", "==", orderId));
        const trxSnap = await getDocs(trxQuery);
        for (const tDoc of trxSnap.docs) {
          await updateDoc(tDoc.ref, {
            statusTransaksi: effectiveTrxStatus,
            waktuPembayaran: effectiveTrxStatus === "berhasil" ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Gagal sinkronisasi transaksi:", err);
      }
    }

    // If cancelled, restore stock atomically in Firestore
    if (statusPesanan === "dibatalkan") {
      try {
        const orderSnap = await getDoc(doc(db, "pesanan", orderId));
        if (orderSnap.exists()) {
          const itemsSnap = await getDocs(collection(db, "pesanan", orderId, "items"));
          for (const itemDoc of itemsSnap.docs) {
            const item = itemDoc.data() as OrderItem;
            const menuRef = doc(db, "menu", item.menuId);
            const menuSnap = await getDoc(menuRef);
            if (menuSnap.exists()) {
              const currentStock = menuSnap.data().stok || 0;
              await updateDoc(menuRef, {
                stok: currentStock + item.jumlahPesanan,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengembalikan stok menu saat pembatalan:", err);
      }
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const snap = await getDocs(collection(db, "transaksi"));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Transaction));
    } catch (e) {
      console.error("Gagal mengambil transaksi dari Firestore:", e);
      return [];
    }
  },

  // Checkout via server API or direct Firestore transaction
  async checkout(params: {
    pemesanId: string;
    namaPemesan: string;
    kantinId: string;
    namaKantin: string;
    metodeTransaksi: PaymentMethod;
    catatan?: string;
    buktiBayarUrl?: string;
    jadwalPengambilan?: JadwalPengambilan;
    labelPengambilan?: string;
    kodeVoucher?: string;
    diskonVoucher?: number;
    items: { menu: MenuItem; quantity: number; catatanItem?: string }[];
  }): Promise<{ success: boolean; orderId?: string; kodePesanan?: string; error?: string }> {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.error && !data.isOfflineFallback) {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Gagal checkout via API:", err);
    }

    // Direct Firestore checkout fallback
    try {
      for (const item of params.items) {
        const menuSnap = await getDoc(doc(db, "menu", item.menu.id));
        if (!menuSnap.exists()) {
          return { success: false, error: `Menu ${item.menu.namaMenu} tidak ditemukan.` };
        }
        const mData = menuSnap.data();
        if (!mData.isAvailable || mData.stok < item.quantity) {
          return {
            success: false,
            error: `Stok ${mData.namaMenu} tidak mencukupi (sisa ${mData.stok}).`,
          };
        }
      }

      // Calculate total & discount
      let subtotal = 0;
      const orderItems: OrderItem[] = params.items.map((it) => {
        const itemSubtotal = it.menu.hargaMenu * it.quantity;
        subtotal += itemSubtotal;
        return {
          menuId: it.menu.id,
          namaMenuSnapshot: it.menu.namaMenu,
          hargaMenuSnapshot: it.menu.hargaMenu,
          jumlahPesanan: it.quantity,
          subtotalItem: itemSubtotal,
          gambarUrlSnapshot: it.menu.gambarUrl,
          catatanItem: it.catatanItem || "",
        };
      });

      const discount = Math.max(0, Number(params.diskonVoucher) || 0);
      const finalTotal = Math.max(0, subtotal - discount);

      // Handle KantinPay deduction if used
      const isKantinPay = params.metodeTransaksi === "KantinPay";
      if (isKantinPay) {
        const deductResult = await DataService.deductSaldo(
          params.pemesanId,
          finalTotal,
          `Pembayaran Pesanan Kantin`
        );
        if (!deductResult.success) {
          return {
            success: false,
            error: deductResult.error || "Saldo KantinPay tidak mencukupi untuk pembayaran ini.",
          };
        }
      }

      // Deduct stock in Firestore
      for (const item of params.items) {
        const menuRef = doc(db, "menu", item.menu.id);
        const menuSnap = await getDoc(menuRef);
        const currentStock = menuSnap.data()?.stok || 0;
        await updateDoc(menuRef, {
          stok: currentStock - item.quantity,
          updatedAt: serverTimestamp(),
        });
      }

      // Create order
      const ordersSnap = await getDocs(collection(db, "pesanan"));
      const nextNum = ordersSnap.size + 1;
      const kodePesanan = `B${String(nextNum).padStart(3, "0")}`;
      const queueNum = ((nextNum - 1) % 99) + 1;
      const nomorAntrean = `A-${String(queueNum).padStart(2, "0")}`;
      const totalQty = params.items.reduce((s, i) => s + (i.quantity || 1), 0);
      const estimasiMenit = Math.min(30, 10 + totalQty * 2);
      const orderRef = doc(collection(db, "pesanan"));

      const initialTrxStatus = isKantinPay ? "berhasil" : "menunggu";

      const newOrder: Order = {
        id: orderRef.id,
        kodePesanan,
        nomorAntrean,
        pemesanId: params.pemesanId,
        namaPemesanSnapshot: params.namaPemesan,
        kantinId: params.kantinId,
        namaKantinSnapshot: params.namaKantin,
        tanggalPemesanan: new Date().toISOString(),
        statusPesanan: "menunggu",
        metodeTransaksi: params.metodeTransaksi,
        statusTransaksi: initialTrxStatus,
        subtotal,
        diskonVoucher: discount,
        kodeVoucher: params.kodeVoucher || "",
        totalHarga: finalTotal,
        catatan: params.catatan || "",
        buktiBayarUrl: params.buktiBayarUrl || "",
        estimasiMenit,
        jadwalPengambilan: params.jadwalPengambilan || "langsung",
        labelPengambilan: params.labelPengambilan || "Langsung / Sekarang (~15 Menit)",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(orderRef, {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Save subcollection items
      for (const it of orderItems) {
        await addDoc(collection(db, "pesanan", orderRef.id, "items"), it);
      }

      // Create transaction
      const trxRef = doc(collection(db, "transaksi"));
      const trxsSnap = await getDocs(collection(db, "transaksi"));
      const kodeTransaksi = `C${String(trxsSnap.size + 1).padStart(3, "0")}`;

      const newTrx: Transaction = {
        id: trxRef.id,
        kodeTransaksi,
        pesananId: orderRef.id,
        pemesanId: params.pemesanId,
        metodeTransaksi: params.metodeTransaksi,
        statusTransaksi: initialTrxStatus,
        jumlahPembayaran: finalTotal,
        referensiPembayaran: isKantinPay
          ? `KP-${Date.now()}`
          : params.metodeTransaksi === "QRIS"
          ? `QRIS-${Date.now()}`
          : `CASH-${kodePesanan}`,
        waktuPembayaran: isKantinPay ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(trxRef, {
        ...newTrx,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, orderId: orderRef.id, kodePesanan };
    } catch (err: any) {
      console.error("Firestore checkout error:", err);
      return { success: false, error: err.message || "Gagal memproses pesanan di database." };
    }
  },

  // ================= REALTIME SUBSCRIPTIONS =================
  subscribeOrder(orderId: string, callback: (order: Order | null) => void) {
    return onSnapshot(
      doc(db, "pesanan", orderId),
      async (snap) => {
        if (snap.exists()) {
          const order = { ...snap.data(), id: snap.id } as Order;
          try {
            const itemsSnap = await getDocs(collection(db, "pesanan", orderId, "items"));
            if (!itemsSnap.empty) {
              order.items = itemsSnap.docs.map((d) => d.data() as OrderItem);
            }
          } catch (e) {
            // ignore
          }
          callback(order);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error("subscribeOrder error:", err);
      }
    );
  },

  subscribeOrders(callback: (orders: Order[]) => void, kantinId?: string) {
    return onSnapshot(
      collection(db, "pesanan"),
      (snap) => {
        let list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
        if (kantinId && kantinId !== "semua") {
          list = list.filter((o) => o.kantinId === kantinId);
        }
        list.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        callback(list);
      },
      (err) => {
        console.error("subscribeOrders error:", err);
      }
    );
  },

  subscribePendingOrdersCount(callback: (count: number) => void, kantinId?: string) {
    return onSnapshot(
      collection(db, "pesanan"),
      (snap) => {
        let count = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.statusPesanan === "menunggu") {
            if (!kantinId || kantinId === "semua" || data.kantinId === kantinId) {
              count++;
            }
          }
        });
        callback(count);
      },
      (err) => {
        console.error("subscribePendingOrdersCount error:", err);
      }
    );
  },



  // ================= KANTINPAY & SALDO SISWA =================
  async getSaldo(userId: string): Promise<number> {
    try {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        return snap.data().saldoKantin || 0;
      }
      return 0;
    } catch (e) {
      console.error("Gagal mengambil saldo:", e);
      return 0;
    }
  },

  async topupSaldo(
    userId: string,
    amount: number,
    keterangan: string = "Top Up Saldo KantinPay"
  ): Promise<{ success: boolean; newSaldo: number }> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const currentSaldo = userSnap.exists() ? userSnap.data().saldoKantin || 0 : 0;
      const newSaldo = currentSaldo + amount;

      await updateDoc(userRef, {
        saldoKantin: newSaldo,
        updatedAt: serverTimestamp(),
      });

      // Catat mutasi saldo
      const mutasiRef = doc(collection(db, "saldo_mutasi"));
      await setDoc(mutasiRef, {
        id: mutasiRef.id,
        userId,
        tipe: "topup",
        jumlah: amount,
        saldoSebelum: currentSaldo,
        saldoSesudah: newSaldo,
        keterangan,
        createdAt: serverTimestamp(),
      });

      return { success: true, newSaldo };
    } catch (e) {
      console.error("Gagal top up saldo:", e);
      return { success: false, newSaldo: 0 };
    }
  },

  async deductSaldo(
    userId: string,
    amount: number,
    keterangan: string = "Pembayaran Pesanan"
  ): Promise<{ success: boolean; newSaldo: number; error?: string }> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const currentSaldo = userSnap.exists() ? userSnap.data().saldoKantin || 0 : 0;

      if (currentSaldo < amount) {
        return {
          success: false,
          newSaldo: currentSaldo,
          error: "Saldo KantinPay tidak mencukupi.",
        };
      }

      const newSaldo = currentSaldo - amount;

      await updateDoc(userRef, {
        saldoKantin: newSaldo,
        updatedAt: serverTimestamp(),
      });

      // Catat mutasi saldo
      const mutasiRef = doc(collection(db, "saldo_mutasi"));
      await setDoc(mutasiRef, {
        id: mutasiRef.id,
        userId,
        tipe: "pembayaran",
        jumlah: amount,
        saldoSebelum: currentSaldo,
        saldoSesudah: newSaldo,
        keterangan,
        createdAt: serverTimestamp(),
      });

      return { success: true, newSaldo };
    } catch (e) {
      console.error("Gagal memotong saldo:", e);
      return { success: false, newSaldo: 0, error: "Gagal memproses saldo." };
    }
  },

  async getSaldoMutations(userId: string): Promise<SaldoMutation[]> {
    try {
      const q = query(
        collection(db, "saldo_mutasi"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as SaldoMutation));
      return list.sort(
        (a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime() -
                  new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime()
      );
    } catch (e) {
      console.error("Gagal mengambil mutasi saldo:", e);
      return [];
    }
  },

  // ================= REVIEWS & RATINGS =================
  async getMenuReviews(menuId: string): Promise<MenuReview[]> {
    try {
      const q = query(collection(db, "menu_reviews"), where("menuId", "==", menuId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MenuReview));
      return list.sort(
        (a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime() -
                  new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime()
      );
    } catch (e) {
      console.error("Gagal mengambil ulasan menu:", e);
      return [];
    }
  },

  async getReviewsByPesananId(pesananId: string): Promise<MenuReview[]> {
    try {
      const q = query(collection(db, "menu_reviews"), where("pesananId", "==", pesananId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as MenuReview));
    } catch (e) {
      console.error("Gagal mengecek review pesanan:", e);
      return [];
    }
  },

  async addMenuReview(data: Omit<MenuReview, "id" | "createdAt">): Promise<MenuReview> {
    const revRef = doc(collection(db, "menu_reviews"));
    const newRev: MenuReview = {
      ...data,
      id: revRef.id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(revRef, {
      ...newRev,
      createdAt: serverTimestamp(),
    });

    // Update menu average rating
    try {
      const q = query(collection(db, "menu_reviews"), where("menuId", "==", data.menuId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const totalUlasan = snap.size;
        let sumRating = 0;
        snap.forEach((d) => {
          sumRating += d.data().rating || 5;
        });
        const ratingRataRata = Number((sumRating / totalUlasan).toFixed(1));
        await updateDoc(doc(db, "menu", data.menuId), {
          ratingRataRata,
          totalUlasan,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Gagal update average rating menu:", err);
    }

    return newRev;
  },

  // ================= SETTINGS OPERASIONAL =================
  async getSettings(): Promise<KantinSettings> {
    const defaultSettings: KantinSettings = {
      jamBuka: "07:00",
      jamTutup: "15:00",
      isStoreOpenManual: true,
      pesanTutup: "Kantin sedang tutup. Silakan kembali saat jam operasional (07:00 - 15:00).",
    };
    try {
      const snap = await getDoc(doc(db, "settings", "operational"));
      if (snap.exists()) {
        return { ...defaultSettings, ...snap.data() } as KantinSettings;
      }
      return defaultSettings;
    } catch (e) {
      console.error("Gagal mengambil pengaturan kantin:", e);
      return defaultSettings;
    }
  },

  async updateSettings(data: Partial<KantinSettings>): Promise<void> {
    try {
      const ref = doc(db, "settings", "operational");
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error("Gagal menyimpan pengaturan kantin:", e);
      throw e;
    }
  },
};
