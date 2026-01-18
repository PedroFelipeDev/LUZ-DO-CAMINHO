import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const toggleFavorite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { verseRef, text } = data;
    const uid = context.auth.uid;
    const db = admin.firestore();

    // Use a unique ID based on verse ref to avoid duplicates or simpler logic
    const docRef = db.collection("users").doc(uid).collection("favorites").doc(verseRef.replace(/\s+/g, "_"));

    const doc = await docRef.get();

    if (doc.exists) {
        await docRef.delete();
        return { favorite: false };
    } else {
        await docRef.set({
            verseRef,
            text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { favorite: true };
    }
});
