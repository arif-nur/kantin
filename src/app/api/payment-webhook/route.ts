import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

// In-memory or Firestore set of processed event IDs for deduplication
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-callback-signature") || req.headers.get("x-signature");

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { eventId, orderId, transactionStatus, paidAmount } = payload;

    // 1. Deduplication check (Idempotency)
    if (eventId && processedEvents.has(eventId)) {
      return NextResponse.json({ message: "Event already processed" }, { status: 200 });
    }

    // 2. Signature verification check if secret configured
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret && signature !== webhookSecret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Update order in Firestore
    try {
      const orderRef = adminDb.collection("pesanan").doc(orderId);
      const isSuccess = transactionStatus === "SUCCESS" || transactionStatus === "berhasil";

      await orderRef.update({
        statusPesanan: isSuccess ? "dikonfirmasi" : "dibatalkan",
        statusTransaksi: isSuccess ? "berhasil" : "gagal",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update related transaction
      const trxQuery = await adminDb
        .collection("transaksi")
        .where("pesananId", "==", orderId)
        .limit(1)
        .get();

      if (!trxQuery.empty) {
        await trxQuery.docs[0].ref.update({
          statusTransaksi: isSuccess ? "berhasil" : "gagal",
          waktuPembayaran: isSuccess ? admin.firestore.FieldValue.serverTimestamp() : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (dbErr) {
      console.warn("Webhook firestore update warning:", dbErr);
    }

    if (eventId) {
      processedEvents.add(eventId);
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to handle webhook" },
      { status: 500 }
    );
  }
}
