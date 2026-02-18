
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  Timestamp
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { User, Listing } from "../types";

export const FirebaseService = {
  // User Profile Management
  async saveUserProfile(user: User): Promise<void> {
    try {
      if (!db || !auth.currentUser) return;
      // Use email or UID as document ID for security rules compatibility
      const userRef = doc(db, "users", user.email || user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("Firestore profile sync ignored: Missing permissions. User likely not signed in.");
      } else {
        console.error("Firestore saveUserProfile failed:", e);
      }
    }
  },

  async getUserByPhone(identifier: string): Promise<User | null> {
    try {
      if (!db || !auth.currentUser) return null;
      const userRef = doc(db, "users", identifier);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? (userSnap.data() as User) : null;
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("Firestore read denied: Missing permissions. Use Auth session first.");
      }
      return null;
    }
  },

  // Listing Management
  async getListings(): Promise<Listing[]> {
    try {
      if (!db) return [];
      const listingsRef = collection(db, "listings");

      // Attempt to fetch from cloud
      const querySnapshot = await getDocs(listingsRef);
      const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));

      // Filter for verified listings on client side
      return allListings.filter(l => l.isVerified === true);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("Firestore getListings: Permission Denied. Rules likely require authentication.");
      } else {
        console.error("Firestore getListings failed:", e.message);
      }
      throw e; // Bubble up for App.tsx to handle via Mock fallback
    }
  },

  async createListing(listing: Omit<Listing, 'id'>): Promise<string> {
    try {
      if (!db || !auth.currentUser) throw new Error("Authentication required for submissions");
      const listingsRef = collection(db, "listings");
      const docRef = await addDoc(listingsRef, {
        ...listing,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (e) {
      console.error("Firestore createListing failed:", e);
      throw e;
    }
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<void> {
    try {
      if (!db || !auth.currentUser) return;
      const listingRef = doc(db, "listings", id);
      await updateDoc(listingRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      console.error("Firestore updateListing failed:", e);
      throw e;
    }
  },

  // Image Storage
  async uploadPropertyImage(path: string, file: File | string): Promise<string> {
    try {
      if (!storage || !auth.currentUser) throw new Error("Storage requires an active session");
      const storageRef = ref(storage, path);

      if (typeof file === 'string') {
        const cleanData = file.includes(",") ? file.split(",")[1] : file;
        await uploadString(storageRef, cleanData, 'base64');
      } else {
        const { uploadBytes } = await import("firebase/storage");
        await uploadBytes(storageRef, file);
      }

      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Firebase Storage upload failed:", e);
      throw e;
    }
  },

  // Unlock Transaction logic
  async unlockListingForUser(identifier: string, listingId: string): Promise<void> {
    try {
      if (!db || !auth.currentUser) return;
      const userRef = doc(db, "users", identifier);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        const unlocked = [...(userData.unlockedListings || [])];
        if (!unlocked.includes(listingId)) {
          unlocked.push(listingId);
          await updateDoc(userRef, { unlockedListings: unlocked });
        }
      }
    } catch (e) {
      console.error("Firestore unlockListingForUser failed:", e);
      throw e;
    }
  }
};
