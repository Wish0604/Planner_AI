import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  getFirestore
} from "firebase/firestore";
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

/**
 * Subscribe to user's projects with real-time updates
 * @param {string} uid - User ID
 * @param {function} callback - Called with projects array on every update
 * @returns {function} Unsubscribe function
 */
export function subscribeToProjects(uid, callback) {
  if (!uid) return () => {};

  try {
    const q = query(
      collection(db, "users", uid, "projects"),
      orderBy("lastUpdated", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(projects);
    }, (error) => {
      console.error("Error listening to projects:", error);
      callback([]);
    });
  } catch (error) {
    console.error("Error setting up project listener:", error);
    return () => {};
  }
}

/**
 * Save a new project to Firestore
 * @param {string} uid - User ID
 * @param {string} title - Project title
 * @param {object} report - Project report/roadmap data
 * @returns {Promise<string>} Project ID
 */
export async function saveProject(uid, title, report) {
  try {
    const projectRef = doc(collection(db, "users", uid, "projects"));

    await setDoc(projectRef, {
      title: (title || "Untitled Project").trim(),
      report,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });

    return projectRef.id;
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
}

/**
 * Update project's lastUpdated timestamp
 * @param {string} uid - User ID
 * @param {string} projectId - Project ID
 */
export async function updateProjectTimestamp(uid, projectId) {
  try {
    const projectRef = doc(db, "users", uid, "projects", projectId);
    await setDoc(projectRef, { lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating project timestamp:", error);
  }
}

/**
 * Update project fields (e.g., title, report) and touch lastUpdated
 * @param {string} uid
 * @param {string} projectId
 * @param {object} data - fields to merge into project
 */
export async function updateProject(uid, projectId, data) {
  try {
    const projectRef = doc(db, "users", uid, "projects", projectId);
    await setDoc(projectRef, { ...data, lastUpdated: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

/**
 * Delete a project by id
 * @param {string} uid
 * @param {string} projectId
 */
export async function deleteProject(uid, projectId) {
  try {
    const projectRef = doc(db, "users", uid, "projects", projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}
