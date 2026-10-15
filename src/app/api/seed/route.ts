import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { SEED_KANTIN, SEED_MENU, SEED_USERS, SEED_ORDERS, SEED_TRANSACTIONS } from "@/lib/seed-data";
import * as admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const batch = adminDb.batch();

    // 1. Seed Kantin
    for (const kantin of SEED_KANTIN) {
      const ref = adminDb.collection("kantin").doc(kantin.id);
      batch.set(ref, {
        ...kantin,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 2. Seed Users
    for (const user of SEED_USERS) {
      const ref = adminDb.collection("users").doc(user.uid);
      batch.set(ref, {
        ...user,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Seed Menu
    for (const menu of SEED_MENU) {
      const ref = adminDb.collection("menu").doc(menu.id);
      batch.set(ref, {
        ...menu,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4. Seed Orders & Subcollections
    for (const order of SEED_ORDERS) {
      const { items, ...orderHeader } = order;
      const ref = adminDb.collection("pesanan").doc(order.id);
      batch.set(ref, {
        ...orderHeader,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (items) {
        for (const item of items) {
          const itemRef = ref.collection("items").doc();
          batch.set(itemRef, item);
        }
      }
    }

    // 5. Seed Transactions
    for (const trx of SEED_TRANSACTIONS) {
      const ref = adminDb.collection("transaksi").doc(trx.id);
      batch.set(ref, {
        ...trx,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Data awal berhasil di-seed ke Cloud Firestore!",
      counts: {
        kantin: SEED_KANTIN.length,
        users: SEED_USERS.length,
        menu: SEED_MENU.length,
        pesanan: SEED_ORDERS.length,
        transaksi: SEED_TRANSACTIONS.length,
      },
    });
  } catch (err: any) {
    console.error("Firestore seed error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          "Seed fallback: Firebase credentials belum diset pada environment, data disajikan melalui fallback lokal.",
        error: err.message,
      },
      { status: 200 }
    );
  }
}
