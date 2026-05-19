/**
 * Autor: Brandon Medina
 * Fecha: 11/05/2026
 * Descripción: Configuración del Admin SDK de Firebase para las rutas API de DAWGS.
 */

import * as admin from "firebase-admin";

const MOCK_PROJECT_ID = "dawgs-underground-mock";

let adminDb: admin.firestore.Firestore | null = null;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || MOCK_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "mock@dawgs-underground-mock.iam.gserviceaccount.com",
        // Format private key correctly if provided
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n",
      }),
    });
    console.log("Firebase Admin initialized successfully.");
    adminDb = admin.firestore();
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }
} else {
  adminDb = admin.firestore();
}

export { adminDb };
