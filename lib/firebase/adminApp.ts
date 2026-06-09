import "server-only";

import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore | null = null;

function cleanEnv(value: string | undefined): string {
  return (value || "").trim();
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function isPlaceholderPrivateKey(value: string): boolean {
  return !value || value.includes("...") || value.includes("BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY");
}

const firebaseProjectId = cleanEnv(process.env.FIREBASE_PROJECT_ID);
const firebaseClientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
const firebasePrivateKey = normalizePrivateKey(cleanEnv(process.env.FIREBASE_PRIVATE_KEY));

const hasFirebaseEnv =
  Boolean(firebaseProjectId) &&
  Boolean(firebaseClientEmail) &&
  !isPlaceholderPrivateKey(firebasePrivateKey);

if (hasFirebaseEnv) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
    }
    adminDb = admin.firestore();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Firebase Admin no inicializado. Usa credenciales validas o Supabase.", message);
    adminDb = null;
  }
}

export { adminDb };
