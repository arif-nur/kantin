import { NextRequest, NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    // Validate role header or body
    const body = await req.json().catch(() => ({}));
    const userRole = req.headers.get("x-user-role") || body.role;

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin kantin yang diizinkan mengunggah gambar menu." },
        { status: 403 }
      );
    }

    const folder = body.folder || "kantin-sekolah/menu";
    const signatureData = generateUploadSignature(folder);

    return NextResponse.json({
      success: true,
      ...signatureData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal membuat tanda tangan unggah Cloudinary" },
      { status: 500 }
    );
  }
}
