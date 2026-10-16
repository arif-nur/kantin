import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pemesanId,
      namaPemesan,
      kantinId,
      namaKantin,
      metodeTransaksi,
      catatan,
      buktiBayarUrl,
      jadwalPengambilan,
      labelPengambilan,
      kodeVoucher,
      diskonVoucher,
      items,
    } = body;

    if (!pemesanId || !kantinId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Parameter pesanan tidak lengkap." },
        { status: 400 }
      );
    }

    // Try executing Firestore atomic transaction on server
    try {
      const result = await adminDb.runTransaction(async (transaction) => {
        // 1. ALL READS FIRST
        const userRef = adminDb.collection("users").doc(pemesanId);
        const userDoc = await transaction.get(userRef);

        const menuSnapshots: { snap: admin.firestore.DocumentSnapshot; reqQty: number; menuId: string; itemRef: any }[] = [];
        
        for (const item of items) {
          const menuRef = adminDb.collection("menu").doc(item.menu.id);
          const menuDoc = await transaction.get(menuRef);
          menuSnapshots.push({
            snap: menuDoc,
            reqQty: item.quantity,
            menuId: item.menu.id,
            itemRef: item,
          });
        }

        // Validate stock and price
        let calculatedSubtotal = 0;
        const validOrderItems: any[] = [];

        for (const { snap, reqQty, menuId, itemRef } of menuSnapshots) {
          if (!snap.exists) {
            throw new Error(`Menu ID ${menuId} tidak ditemukan.`);
          }
          const menuData = snap.data()!;
          if (!menuData.isAvailable) {
            throw new Error(`Menu "${menuData.namaMenu}" sedang tidak tersedia.`);
          }
          if (menuData.stok < reqQty) {
            throw new Error(
              `Stok "${menuData.namaMenu}" tidak mencukupi (Tersisa: ${menuData.stok}).`
            );
          }

          const price = menuData.hargaMenu;
          calculatedSubtotal += price * reqQty;

          validOrderItems.push({
            menuId,
            namaMenuSnapshot: menuData.namaMenu,
            hargaMenuSnapshot: price,
            jumlahPesanan: reqQty,
            subtotalItem: price * reqQty,
            gambarUrlSnapshot: menuData.gambarUrl || "",
            catatanItem: itemRef.catatanItem || "",
          });
        }

        const discount = Math.max(0, Number(diskonVoucher) || 0);
        const finalTotal = Math.max(0, calculatedSubtotal - discount);

        // Validate KantinPay balance if selected
        const isKantinPay = metodeTransaksi === "KantinPay";
        let currentSaldo = 0;
        if (isKantinPay) {
          currentSaldo = userDoc.exists ? (userDoc.data()?.saldoKantin || 0) : 0;
          if (currentSaldo < finalTotal) {
            throw new Error(
              `Saldo KantinPay tidak mencukupi (Saldo: Rp ${currentSaldo.toLocaleString("id-ID")}, Total: Rp ${finalTotal.toLocaleString("id-ID")}). Silakan top up atau pilih metode lain.`
            );
          }
        }

        // 2. ALL WRITES AFTER READS
        // Decrement stock atomically
        for (const { snap, reqQty } of menuSnapshots) {
          const currentStock = snap.data()!.stok;
          transaction.update(snap.ref, {
            stok: currentStock - reqQty,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Generate codes & daily queue number
        const orderCountSnap = await adminDb.collection("pesanan").count().get();
        const nextOrderNum = (orderCountSnap.data().count || 0) + 1;
        const kodePesanan = `B${String(nextOrderNum).padStart(3, "0")}`;
        const queueNum = ((nextOrderNum - 1) % 99) + 1;
        const nomorAntrean = `A-${String(queueNum).padStart(2, "0")}`;
        const totalQty = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
        const estimasiMenit = Math.min(30, 10 + totalQty * 2);

        // Deduct KantinPay if used
        if (isKantinPay) {
          const newSaldo = currentSaldo - finalTotal;
          transaction.update(userRef, {
            saldoKantin: newSaldo,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const mutasiRef = adminDb.collection("saldo_mutasi").doc();
          transaction.set(mutasiRef, {
            id: mutasiRef.id,
            userId: pemesanId,
            tipe: "pembayaran",
            jumlah: finalTotal,
            saldoSebelum: currentSaldo,
            saldoSesudah: newSaldo,
            keterangan: `Pembayaran Pesanan #${kodePesanan}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        const initialTrxStatus = isKantinPay ? "berhasil" : "menunggu";
        const initialPaymentTime = isKantinPay ? admin.firestore.FieldValue.serverTimestamp() : null;

        const orderRef = adminDb.collection("pesanan").doc();
        const orderData = {
          id: orderRef.id,
          kodePesanan,
          nomorAntrean,
          pemesanId,
          namaPemesanSnapshot: namaPemesan,
          kantinId,
          namaKantinSnapshot: namaKantin,
          tanggalPemesanan: admin.firestore.FieldValue.serverTimestamp(),
          statusPesanan: "menunggu",
          metodeTransaksi,
          statusTransaksi: initialTrxStatus,
          subtotal: calculatedSubtotal,
          diskonVoucher: discount,
          kodeVoucher: kodeVoucher || "",
          totalHarga: finalTotal,
          catatan: catatan || "",
          buktiBayarUrl: buktiBayarUrl || "",
          estimasiMenit,
          jadwalPengambilan: jadwalPengambilan || "langsung",
          labelPengambilan: labelPengambilan || "Langsung / Sekarang (~15 Menit)",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.set(orderRef, orderData);

        // Create transaction record
        const trxCountSnap = await adminDb.collection("transaksi").count().get();
        const nextTrxNum = (trxCountSnap.data().count || 0) + 1;
        const kodeTransaksi = `C${String(nextTrxNum).padStart(3, "0")}`;

        const trxRef = adminDb.collection("transaksi").doc();
        transaction.set(trxRef, {
          id: trxRef.id,
          kodeTransaksi,
          pesananId: orderRef.id,
          pemesanId,
          metodeTransaksi,
          statusTransaksi: initialTrxStatus,
          jumlahPembayaran: finalTotal,
          referensiPembayaran: isKantinPay
            ? `KP-${Date.now()}`
            : metodeTransaksi === "QRIS"
            ? `QRIS-${Date.now()}`
            : `CASH-${kodePesanan}`,
          waktuPembayaran: initialPaymentTime,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          orderId: orderRef.id,
          kodePesanan,
          validOrderItems,
        };
      });

      // Save subcollection items
      const batch = adminDb.batch();
      for (const it of result.validOrderItems) {
        const itemRef = adminDb
          .collection("pesanan")
          .doc(result.orderId)
          .collection("items")
          .doc();
        batch.set(itemRef, it);
      }
      await batch.commit();

      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        kodePesanan: result.kodePesanan,
      });
    } catch (dbError: any) {
      console.warn("Firestore Admin transaction error / fallback mode:", dbError.message);
      // Return signal to client that offline/local fallback can execute
      return NextResponse.json(
        {
          success: false,
          isOfflineFallback: true,
          error: dbError.message,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
