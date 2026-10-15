"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MenuItem, CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  currentKantinId: string | null;
  currentKantinNama: string | null;
  addItem: (menu: MenuItem, kantinNama?: string) => { success: boolean; message?: string };
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentKantinId, setCurrentKantinId] = useState<string | null>(null);
  const [currentKantinNama, setCurrentKantinNama] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kantin_cart");
      const savedKantinId = localStorage.getItem("kantin_id");
      const savedKantinNama = localStorage.getItem("kantin_nama");

      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      if (savedKantinId) {
        setCurrentKantinId(savedKantinId);
      }
      if (savedKantinNama) {
        setCurrentKantinNama(savedKantinNama);
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
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [items, currentKantinId, currentKantinNama]);

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

    return { success: true };
  };

  const removeItem = (menuId: string) => {
    const updated = items.filter((i) => i.menu.id !== menuId);
    setItems(updated);
    if (updated.length === 0) {
      setCurrentKantinId(null);
      setCurrentKantinNama(null);
    }
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
    localStorage.removeItem("kantin_cart");
    localStorage.removeItem("kantin_id");
    localStorage.removeItem("kantin_nama");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.menu.hargaMenu * item.quantity, 0);
  const totalPrice = subtotal; // Can add admin fee or delivery fee if needed

  return (
    <CartContext.Provider
      value={{
        items,
        currentKantinId,
        currentKantinNama,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        totalPrice,
      }}
    >
      {children}
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
