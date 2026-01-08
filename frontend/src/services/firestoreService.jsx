import { getFirestore, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveAnalysis(userId, projectIdea, report) {
  try {
    const docRef = await addDoc(collection(db, "analyses"), {
      userId,
      projectIdea,
      report,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.error("Error saving analysis:", err);
    throw err;
  }
}

export async function getUserAnalyses(userId) {
  try {
    const q = query(
      collection(db, "analyses"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Error fetching analyses:", err);
    return [];
  }
}
