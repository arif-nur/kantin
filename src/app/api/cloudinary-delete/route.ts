import { NextRequest, NextResponse } from "next/server";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicId, role } = body;
    const userRole = req.headers.get("x-user-role") || role;

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menghapus aset menu." },
        { status: 403 }
      );
    }

    if (!publicId) {
      return NextResponse.json({ error: "publicId wajib diisi" }, { status: 400 });
    }

    const res = await deleteCloudinaryImage(publicId);
    return NextResponse.json({ success: true, result: res });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menghapus gambar di Cloudinary" },
      { status: 500 }
    );
  }
}
