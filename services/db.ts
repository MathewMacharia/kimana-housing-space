
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth, functions, httpsCallable } from "../firebase";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { User, Listing, UserRole } from "../types";
import { LoggerService } from "./logger";
import { RateLimiter } from "./rateLimiter";

// Throttling state for expensive operations
let lastRevealTime = 0;

export const FirebaseService = {
  // User Profile Management
  async saveUserProfile(user: User): Promise<void> {
    try {
      if (!db) throw new Error("Firestore database not initialized");

      const collectionName = user.role === UserRole.LANDLORD ? "landlords" : "tenants";
      // ALWAYS use UID (user.id) as the primary key for consistency
      if (!user.id) throw new Error("User ID is required to save profile");
      
      // PREVENT IDOR: Ensure the user is only saving their own profile
      if (auth.currentUser && user.id !== auth.currentUser.uid) {
        throw new Error("Unauthorized: Cannot modify another user's profile.");
      }

      const userRef = doc(db, collectionName, user.id);

      // We strip sensitive or redundant fields if needed, but for now we save the object
      await setDoc(userRef, {
        ...user,
        updatedAt: Timestamp.now()
      }, { merge: true });

      console.log(`✅ Profile successfully saved to "${collectionName}" collection for:`, user.email);
    } catch (e: any) {
      console.error("❌ Firestore saveUserProfile failed:", e);
      await LoggerService.logApiError("saveUserProfile", e);
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
      await LoggerService.logApiError("updateUserAccount", e);
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
      
      // RATE LIMIT: Max 10 listing creations per hour per browser
      RateLimiter.checkLimit('CREATE_LISTING', 10, 60 * 60 * 1000);

      const listingsRef = collection(db, "listings");
      
      // PREVENT IDOR: Force the landlordId to be the authenticated user's ID
      const secureListing = {
        ...listing,
        landlordId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(listingsRef, secureListing);
      return docRef.id;
    } catch (e) {
      console.error("Firestore createListing failed:", e);
      await LoggerService.logApiError("createListing", e);
      throw e;
    }
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<void> {
    try {
      if (!db || !auth.currentUser) return;
      
      // PREVENT IDOR: Do not allow frontend to try to transfer ownership maliciously
      if (updates.landlordId && updates.landlordId !== auth.currentUser.uid) {
        delete updates.landlordId;
        console.warn("Blocked attempt to change landlordId during update.");
      }

      const listingRef = doc(db, "listings", id);
      await updateDoc(listingRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      console.error("Firestore updateListing failed:", e);
      await LoggerService.logApiError("updateListing", e);
      throw e;
    }
  },

  // Image Storage
  async uploadPropertyImage(path: string, data: Blob | File): Promise<string> {
    try {
      if (!storage || !auth.currentUser) throw new Error("Storage requires an active session");
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, data);
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

      // RATE LIMIT: Max 10 unlocks per minute to prevent mass-scraping landlord details
      RateLimiter.checkLimit('UNLOCK_LISTING', 10, 60 * 1000);

      // PREVENT IDOR: Users can only unlock listings for themselves
      if (identifier !== auth.currentUser.uid) {
        throw new Error("Unauthorized: Cannot modify unlock history for another user.");
      }

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
      await LoggerService.logApiError("unlockListingForUser", e);
      throw e;
    }
  },

  async toggleFavorite(user: User, listingId: string): Promise<string[]> {
    try {
      if (!db || !auth.currentUser) throw new Error("Authentication required");

      // RATE LIMIT: Max 30 favorites toggled per minute to prevent spamming the db
      RateLimiter.checkLimit('TOGGLE_FAVORITE', 30, 60 * 1000);

      const favorites = [...(user.favorites || [])];
      const index = favorites.indexOf(listingId);

      if (index === -1) {
        favorites.push(listingId);
      } else {
        favorites.splice(index, 1);
      }

      const collectionName = user.role === UserRole.LANDLORD ? "landlords" : "tenants";
      const userRef = doc(db, collectionName, user.id);

      await updateDoc(userRef, {
        favorites: favorites,
        updatedAt: Timestamp.now()
      });

      return favorites;
    } catch (e) {
      console.error("Firestore toggleFavorite failed:", e);
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
  },

  // Secure Infrastructure (Phase 3)
  async revealLandlordContact(listingId: string): Promise<{ name: string, phone: string, email: string }> {
    try {
      // Client-side rate limiting (3 second cooldown)
      const now = Date.now();
      if (now - lastRevealTime < 3000) {
        throw new Error("Please wait a moment before trying again.");
      }
      lastRevealTime = now;

      const revealFunc = httpsCallable(functions, 'revealContact');
      const result = await revealFunc({ listingId });
      return result.data as { name: string, phone: string, email: string };
    } catch (e: any) {
      console.error("Cloud Function revealContact failed:", e);
      throw e;
    }
  },

  // Advanced Scaling (SWR/Caching)
  getCachedListings(): Listing[] {
    try {
      const cached = localStorage.getItem("masqani_listings_cache");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  async getListingsWithSWR(callback: (listings: Listing[]) => void): Promise<void> {
    // 1. Return cached data immediately
    const cached = this.getCachedListings();
    if (cached.length > 0) callback(cached);

    // 2. Fetch fresh data and update cache
    try {
      const freshListings = await this.getListings();
      localStorage.setItem("masqani_listings_cache", JSON.stringify(freshListings));
      callback(freshListings);
    } catch (e) {
      console.error("SWR update failed:", e);
    }
  }
};
