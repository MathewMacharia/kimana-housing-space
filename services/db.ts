
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  limit,
  orderBy,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
  updateEmail
} from "firebase/auth";
import { User, Listing, UserRole } from "../types";

export const FirebaseService = {
  // User Profile Management
  async saveUserProfile(user: User): Promise<void> {
    try {
      if (!db) throw new Error("Firestore database not initialized");

      const collectionName = user.role === UserRole.LANDLORD ? "landlords" : "tenants";
      // ALWAYS use UID (user.id) as the primary key for consistency
      if (!user.id) throw new Error("User ID is required to save profile");

      const userRef = doc(db, collectionName, user.id);

      // We strip sensitive or redundant fields if needed, but for now we save the object
      await setDoc(userRef, {
        ...user,
        updatedAt: Timestamp.now()
      }, { merge: true });

      console.log(`✅ Profile successfully saved to "${collectionName}" collection for:`, user.email);
    } catch (e: any) {
      console.error("❌ Firestore saveUserProfile failed:", e);
      throw e; // Propagate error to caller
    }
  },

  async updateUserAccount(user: User): Promise<void> {
    try {
      if (!auth.currentUser) throw new Error("No authenticated user found");

      // 1. Update Auth Display Name
      if (user.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: user.name });
      }

      // 2. Update Auth Email if changed
      if (user.email !== auth.currentUser.email) {
        try {
          await verifyBeforeUpdateEmail(auth.currentUser, user.email);
          console.log("Verification email sent to new address.");
        } catch (authErr: any) {
          if (authErr.code === 'auth/requires-recent-login') {
            throw new Error("This action requires a recent login. Please logout and login again to change your email.");
          }
          throw authErr;
        }
      }

      // 3. Update Firestore
      await this.saveUserProfile(user);
    } catch (e: any) {
      console.error("❌ updateUserAccount failed:", e);
      throw e;
    }
  },

  async getUserProfile(identifier: string): Promise<User | null> {
    try {
      if (!db) return null;

      // Try searching in Landlords first
      const landlordRef = doc(db, "landlords", identifier);
      let snap = await getDoc(landlordRef);
      if (snap.exists()) return snap.data() as User;

      // Try searching in Tenants
      const tenantRef = doc(db, "tenants", identifier);
      snap = await getDoc(tenantRef);
      if (snap.exists()) return snap.data() as User;

      return null;
    } catch (e: any) {
      console.error("Firestore getUserProfile failed:", e);
      return null;
    }
  },

  // Legacy support for some components
  async getUserByPhone(identifier: string): Promise<User | null> {
    return this.getUserProfile(identifier);
  },

  // Listing Management
  async getListings(): Promise<Listing[]> {
    try {
      if (!db) return [];
      const listingsRef = collection(db, "listings");

      const querySnapshot = await getDocs(listingsRef);
      const allListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));

      // Return all listings (reverted client-side filter as per user request to show all)
      return allListings;
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("Firestore getListings: Permission Denied. Rules likely require authentication.");
      } else {
        console.error("Firestore getListings failed:", e.message);
      }
      throw e;
    }
  },

  subscribeToListings(callback: (listings: Listing[]) => void): () => void {
    if (!db) return () => { };
    const listingsRef = collection(db, "listings");
    // Sort by dateListed as the default ordering for pagination consistency
    const q = query(listingsRef, orderBy("dateListed", "desc"), limit(50));

    return onSnapshot(q, (snapshot) => {
      const allListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      callback(allListings);
    }, (error) => {
      console.error("Firestore subscribeToListings error:", error);
    });
  },

  async getPaginatedListings(pageSize: number = 20, lastVisibleDoc?: QueryDocumentSnapshot): Promise<{ listings: Listing[], lastDoc: QueryDocumentSnapshot | null }> {
    try {
      if (!db) return { listings: [], lastDoc: null };
      const listingsRef = collection(db, "listings");

      let q = query(listingsRef, orderBy("dateListed", "desc"), limit(pageSize));

      if (lastVisibleDoc) {
        q = query(listingsRef, orderBy("dateListed", "desc"), startAfter(lastVisibleDoc), limit(pageSize));
      }

      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { listings, lastDoc };
    } catch (e: any) {
      console.error("Firestore getPaginatedListings failed:", e);
      throw e;
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
  async uploadPropertyImage(path: string, base64Data: string): Promise<string> {
    try {
      if (!storage || !auth.currentUser) throw new Error("Storage requires an active session");
      const storageRef = ref(storage, path);
      // Clean up base64 data to remove data:image/... prefix if present
      const cleanData = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      await uploadString(storageRef, cleanData, 'base64');
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

      const profile = await this.getUserProfile(identifier);
      if (!profile) return;

      const collectionName = profile.role === UserRole.LANDLORD ? "landlords" : "tenants";
      const userRef = doc(db, collectionName, identifier);

      const unlocked = [...(profile.unlockedListings || [])];
      if (!unlocked.includes(listingId)) {
        unlocked.push(listingId);
        await updateDoc(userRef, { unlockedListings: unlocked });
      }
    } catch (e) {
      console.error("Firestore unlockListingForUser failed:", e);
      throw e;
    }
  },

  // Global Settings (Logo, etc)
  async getGlobalSettings(): Promise<any> {
    try {
      if (!db) return null;
      const settingsRef = doc(db, "settings", "global");
      const settingsSnap = await getDoc(settingsRef);
      return settingsSnap.exists() ? settingsSnap.data() : null;
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        return null;
      }
      console.error("Firestore getGlobalSettings failed:", e);
      return null;
    }
  },

  async updateGlobalSettings(updates: any): Promise<void> {
    try {
      if (!db || !auth.currentUser) return;
      const settingsRef = doc(db, "settings", "global");
      await setDoc(settingsRef, {
        ...updates,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (e) {
      console.error("Firestore updateGlobalSettings failed:", e);
      throw e;
    }
  }
};
