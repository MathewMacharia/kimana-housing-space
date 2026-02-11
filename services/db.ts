import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  addDoc,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { User, Listing } from "../types";

export const FirebaseService = {
  // User Profile Management
  async saveUserProfile(user: User): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, "users", user.phone); 
    await setDoc(userRef, {
      ...user,
      updatedAt: Timestamp.now()
    }, { merge: true });
  },

  async getUserByPhone(phone: string): Promise<User | null> {
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as User) : null;
  },

  // Listing Management
  async getListings(): Promise<Listing[]> {
    if (!db) throw new Error("Firestore not initialized");
    const listingsRef = collection(db, "listings");
    // Initially we fetch verified listings
    const q = query(listingsRef, where("isVerified", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
  },

  async createListing(listing: Omit<Listing, 'id'>): Promise<string> {
    if (!db) throw new Error("Firestore not initialized");
    const listingsRef = collection(db, "listings");
    const docRef = await addDoc(listingsRef, {
      ...listing,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async updateListing(id: string, updates: Partial<Listing>): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const listingRef = doc(db, "listings", id);
    await updateDoc(listingRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  // Image Storage
  async uploadPropertyImage(path: string, base64Data: string): Promise<string> {
    if (!storage) throw new Error("Storage not initialized");
    const storageRef = ref(storage, path);
    const cleanData = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    await uploadString(storageRef, cleanData, 'base64');
    return await getDownloadURL(storageRef);
  },

  // Unlock Transaction logic
  async unlockListingForUser(phone: string, listingId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      const unlocked = [...(userData.unlockedListings || [])];
      if (!unlocked.includes(listingId)) {
        unlocked.push(listingId);
        await updateDoc(userRef, { unlockedListings: unlocked });
      }
    }
  }
};