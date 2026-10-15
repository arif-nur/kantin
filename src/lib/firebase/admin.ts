import * as admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kantin-sekolah-demo";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  // Handle escaped newlines in environment variable
  privateKey = privateKey.replace(/\\n/g, "\n");
}

let adminApp: admin.app.App;

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback to default application credentials or dev mock
    try {
      adminApp = admin.initializeApp({
        projectId,
      });
    } catch (e) {
      adminApp = admin.initializeApp(
        {
          projectId,
        },
        "kantin-app-default"
      );
    }
  }
} else {
  adminApp = admin.app();
}

const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

export { adminApp, adminAuth, adminDb };
