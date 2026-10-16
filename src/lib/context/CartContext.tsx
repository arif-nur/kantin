"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MenuItem, CartItem, Voucher } from "@/types";
import { validateVoucher } from "../voucher-service";

interface CartContextType {
  items: CartItem[];
  currentKantinId: string | null;
  currentKantinNama: string | null;
  appliedVoucher: Voucher | null;
  voucherDiscount: number;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  addItem: (menu: MenuItem, kantinNama?: string) => { success: boolean; message?: string };
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => { success: boolean; message?: string };
  updateItemNote: (menuId: string, note: string) => void;
  clearCart: () => void;
  showToast: (message: string) => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentKantinId, setCurrentKantinId] = useState<string | null>(null);
  const [currentKantinNama, setCurrentKantinNama] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kantin_cart");
      const savedKantinId = localStorage.getItem("kantin_id");
      const savedKantinNama = localStorage.getItem("kantin_nama");
      const savedVoucher = localStorage.getItem("kantin_voucher");

      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      if (savedKantinId) {
        setCurrentKantinId(savedKantinId);
      }
      if (savedKantinNama) {
        setCurrentKantinNama(savedKantinNama);
      }
      if (savedVoucher) {
        const v: Voucher = JSON.parse(savedVoucher);
        setAppliedVoucher(v);
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem("kantin_cart", JSON.stringify(items));
      if (currentKantinId) {
        localStorage.setItem("kantin_id", currentKantinId);
      } else {
        localStorage.removeItem("kantin_id");
      }
      if (currentKantinNama) {
        localStorage.setItem("kantin_nama", currentKantinNama);
      } else {
        localStorage.removeItem("kantin_nama");
      }
      if (appliedVoucher) {
        localStorage.setItem("kantin_voucher", JSON.stringify(appliedVoucher));
      } else {
        localStorage.removeItem("kantin_voucher");
      }
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [items, currentKantinId, currentKantinNama, appliedVoucher]);

  const subtotal = items.reduce((sum, item) => sum + item.menu.hargaMenu * item.quantity, 0);

  // Recalculate voucher discount whenever subtotal changes
  useEffect(() => {
    if (!appliedVoucher || subtotal === 0) {
      setVoucherDiscount(0);
      return;
    }

    if (subtotal < appliedVoucher.minBelanja) {
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      showToast(`Voucher dibatalkan karena total belanja di bawah Rp ${appliedVoucher.minBelanja.toLocaleString("id-ID")}`);
      return;
    }

    let disc = 0;
    if (appliedVoucher.tipe === "nominal") {
      disc = appliedVoucher.nilai;
    } else if (appliedVoucher.tipe === "persen") {
      disc = Math.round((subtotal * appliedVoucher.nilai) / 100);
      if (appliedVoucher.maxDiskon && disc > appliedVoucher.maxDiskon) {
        disc = appliedVoucher.maxDiskon;
      }
    }
    setVoucherDiscount(Math.min(disc, subtotal));
  }, [subtotal, appliedVoucher]);

  const applyVoucher = (code: string): { success: boolean; message: string } => {
    const result = validateVoucher(code, subtotal);
    if (result.valid && result.voucher) {
      setAppliedVoucher(result.voucher);
      setVoucherDiscount(result.discount);
      showToast(result.message);
      return { success: true, message: result.message };
    } else {
      showToast(result.message);
      return { success: false, message: result.message };
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    showToast("Voucher promo berhasil dilepas.");
  };

  const addItem = (menu: MenuItem, kantinNama?: string): { success: boolean; message?: string } => {
    if (menu.stok <= 0 || !menu.isAvailable) {
      return { success: false, message: "Stok menu sedang habis!" };
    }

    // Check if user is ordering from a different canteen
    if (currentKantinId && currentKantinId !== menu.kantinId && items.length > 0) {
      return {
        success: false,
        message: "Keranjang hanya dapat berisi pesanan dari satu kantin. Kosongkan keranjang terlebih dahulu jika ingin berganti kantin.",
      };
    }

    const existingIndex = items.findIndex((i) => i.menu.id === menu.id);
    if (existingIndex > -1) {
      const existing = items[existingIndex];
      if (existing.quantity + 1 > menu.stok) {
        return {
          success: false,
          message: `Jumlah pesanan tidak boleh melebihi stok yang tersedia (${menu.stok})`,
        };
      }
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([...items, { menu, quantity: 1 }]);
      setCurrentKantinId(menu.kantinId);
      if (kantinNama) {
        setCurrentKantinNama(kantinNama);
      }
    }

    showToast(`${menu.namaMenu} ditambahkan ke keranjang`);
    return { success: true };
  };

  const removeItem = (menuId: string) => {
    const updated = items.filter((i) => i.menu.id !== menuId);
    setItems(updated);
    if (updated.length === 0) {
      setCurrentKantinId(null);
      setCurrentKantinNama(null);
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    }
  };

  const updateItemNote = (menuId: string, catatanItem: string) => {
    const updated = items.map((i) => (i.menu.id === menuId ? { ...i, catatanItem } : i));
    setItems(updated);
  };

  const updateQuantity = (menuId: string, quantity: number): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeItem(menuId);
      return { success: true };
    }

    const item = items.find((i) => i.menu.id === menuId);
    if (!item) return { success: false, message: "Item tidak ditemukan" };

    if (quantity > item.menu.stok) {
      return {
        success: false,
        message: `Maksimal pemesanan sesuai stok adalah ${item.menu.stok}`,
      };
    }

    const updated = items.map((i) => (i.menu.id === menuId ? { ...i, quantity } : i));
    setItems(updated);
    return { success: true };
  };

  const clearCart = () => {
    setItems([]);
    setCurrentKantinId(null);
    setCurrentKantinNama(null);
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    localStorage.removeItem("kantin_cart");
    localStorage.removeItem("kantin_id");
    localStorage.removeItem("kantin_nama");
    localStorage.removeItem("kantin_voucher");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Math.max(0, subtotal - voucherDiscount);

  return (
    <CartContext.Provider
      value={{
        items,
        currentKantinId,
        currentKantinNama,
        appliedVoucher,
        voucherDiscount,
        applyVoucher,
        removeVoucher,
        addItem,
        removeItem,
        updateQuantity,
        updateItemNote,
        clearCart,
        showToast,
        totalItems,
        subtotal,
        totalPrice,
      }}
    >
      {children}

      {/* Global floating toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in w-full max-w-sm px-4">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white text-[10px]">
              ✓
            </span>
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
