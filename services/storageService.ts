import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  limit,
  enableIndexedDbPersistence,
  Firestore,
  deleteDoc,
  doc
} from "firebase/firestore";
import { SurveySubmission, AuditSubmission, User } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBrXP2cyFVqJK6s88J_qC3JMr2NSDEdZk4",
  authDomain: "ecosurvey-a5f3d.firebaseapp.com",
  projectId: "ecosurvey-a5f3d",
  storageBucket: "ecosurvey-a5f3d.firebasestorage.app",
  messagingSenderId: "704573008984",
  appId: "1:704573008984:web:b3162b60815e0d392fae2d",
  measurementId: "G-6TKJZM9WDQ"
};

let db: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  try {
    // Initialize Firestore with settings to ignore undefined properties
    // This creates the collections implicitly when data is added
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true
    });
  } catch (e) {
    // If Firestore is already initialized (e.g., during hot reload), use the existing instance
    console.debug("Using existing Firestore instance");
    db = getFirestore(app);
  }
  
  if (typeof window !== 'undefined' && db) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistence failed: Browser not supported");
      }
    });
  }
} catch (e) {
  console.error("Firebase Storage Service Initialization Error:", e);
}

const SURVEYS_COLLECTION = 'surveys';
const AUDITS_COLLECTION = 'audits';
const USERS_COLLECTION = 'users';

export const storageService = {
  isConfigured: (): boolean => !!db,

  checkConnection: async (): Promise<boolean> => {
    if (!db) return false;
    try {
      await getDocs(query(collection(db, USERS_COLLECTION), limit(1)));
      return true;
    } catch (e) {
      return false;
    }
  },

  login: async (username: string, password: string): Promise<User | null> => {
    if (!db) throw new Error("Cloud database disconnected.");
    
    try {
      const q = query(
        collection(db, USERS_COLLECTION), 
        where("username", "==", username.toLowerCase().trim()),
        where("password", "==", password),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (e: any) {
      throw new Error(`Login failed: ${e.message}`);
    }
  },

  getUsers: async (): Promise<User[]> => {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (e) {
      console.error("Fetch users failed:", e);
      return [];
    }
  },

  createUser: async (userData: Omit<User, 'id'> & { password?: string }): Promise<void> => {
    if (!db) throw new Error("Storage unreachable.");
    await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      username: userData.username.toLowerCase().trim()
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    if (!db) throw new Error("Storage unreachable.");
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  },

  subscribeToUsers: (callback: (users: User[]) => void) => {
    if (!db) return () => {};
    return onSnapshot(collection(db, USERS_COLLECTION), (s) => {
      callback(s.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    }, (error) => {
      console.error("Users subscription error:", error);
    });
  },

  getSurveys: async (): Promise<SurveySubmission[]> => {
    if (!db) return [];
    try {
      const q = query(collection(db, SURVEYS_COLLECTION), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SurveySubmission));
    } catch (e) {
      console.error("Fetch surveys failed:", e);
      return [];
    }
  },
  
  saveSurvey: async (survey: SurveySubmission): Promise<void> => {
    if (!db) throw new Error("Storage unreachable.");
    try {
      // Removing 'id' from the data payload as Firestore generates its own ID, 
      // or we can use it as the doc ID. Here we let Firestore generate one 
      // but store the data. The 'id' in types usually refers to the doc ID.
      // We accept the object has an ID for local use, but for clean storage:
      const { id, ...dataToSave } = survey;
      await addDoc(collection(db, SURVEYS_COLLECTION), dataToSave);
      console.log("Survey saved to 'surveys' collection.");
    } catch (e) {
      console.error("Save survey failed:", e);
      throw e;
    }
  },

  getAudits: async (): Promise<AuditSubmission[]> => {
    if (!db) return [];
    try {
      const q = query(collection(db, AUDITS_COLLECTION), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AuditSubmission));
    } catch (e) {
      console.error("Fetch audits failed:", e);
      return [];
    }
  },

  saveAudit: async (audit: AuditSubmission): Promise<void> => {
    if (!db) throw new Error("Storage unreachable.");
    try {
      const { id, ...dataToSave } = audit;
      await addDoc(collection(db, AUDITS_COLLECTION), dataToSave);
      console.log("Audit saved to 'audits' collection.");
    } catch (e) {
      console.error("Save audit failed:", e);
      throw e;
    }
  },

  subscribeToAllData: (callback: (data: { surveys: any[], audits: any[] }) => void) => {
    if (!db) return () => {};
    
    let surveys: any[] = [];
    let audits: any[] = [];

    const unsubS = onSnapshot(collection(db, SURVEYS_COLLECTION), (s) => {
      surveys = s.docs.map(d => ({ ...d.data(), id: d.id }));
      callback({ surveys, audits });
    }, (e) => console.error("Survey sub error:", e));
    
    const unsubA = onSnapshot(collection(db, AUDITS_COLLECTION), (s) => {
      audits = s.docs.map(d => ({ ...d.data(), id: d.id }));
      callback({ surveys, audits });
    }, (e) => console.error("Audit sub error:", e));
    
    return () => { unsubS(); unsubA(); };
  }
};