import "server-only";

import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore | null = null;

const hasFirebaseEnv =
  Boolean(process.env.FIREBASE_PROJECT_ID) &&
  Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
  Boolean(process.env.FIREBASE_PRIVATE_KEY);

if (hasFirebaseEnv) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
    }
    adminDb = admin.firestore();
  } catch (error) {
    console.warn("Firebase Admin no inicializado. Usa credenciales validas o Supabase.", error);
    adminDb = null;
  }
}

export { adminDb };
