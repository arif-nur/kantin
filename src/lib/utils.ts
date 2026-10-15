import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(timestamp: any): string {
  if (!timestamp) return "-";
  
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp?.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp === "string" || typeof timestamp === "number") {
    date = new Date(timestamp);
  } else if (timestamp?._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    return "-";
  }

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function generateKode(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export function isKantinOperational(
  jamBuka = "07:00",
  jamTutup = "15:00",
  isStoreOpenManual = true
): { isOpen: boolean; reason?: string } {
  if (!isStoreOpenManual) {
    return { isOpen: false, reason: "Kantin sedang ditutup sementara oleh pengelola." };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [bukaH, bukaM] = (jamBuka || "07:00").split(":").map(Number);
  const [tutupH, tutupM] = (jamTutup || "15:00").split(":").map(Number);

  const startMinutes = (bukaH ?? 7) * 60 + (bukaM ?? 0);
  const endMinutes = (tutupH ?? 15) * 60 + (tutupM ?? 0);

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return {
      isOpen: false,
      reason: `Kantin berada di luar jam operasional (${jamBuka || "07:00"} - ${jamTutup || "15:00"}).`,
    };
  }

  return { isOpen: true };
}
