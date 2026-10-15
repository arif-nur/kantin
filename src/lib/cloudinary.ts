import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function generateUploadSignature(folder: string = "kantin-sekolah/menu") {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET || ""
  );

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

export async function deleteCloudinaryImage(publicId: string) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary API Secret not set, skipping remote deletion");
    return { result: "skipped" };
  }
  return await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
