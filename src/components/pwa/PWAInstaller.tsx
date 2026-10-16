"use client";

import React, { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check online/offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    // Clean any old stale cache and unregister Service Worker during development
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg.scope))
          .catch((err) => console.warn("SW registration failed:", err));
      }
    }

    // Capture install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Alert Bar */}
      {isOffline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Anda sedang dalam mode offline. Fitur checkout memerlukan koneksi internet.</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 z-50 max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 animate-fade-in flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900">Install Kantin Kampus</h4>
            <p className="text-xs text-gray-500 truncate">Pesan makanan lebih cepat dari layar utama!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
