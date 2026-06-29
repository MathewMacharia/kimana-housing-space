
export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD'
}

// --- Listing Category ---
// Determines whether a listing is for rent or for sale/buy
export enum ListingCategory {
  RENT = 'rent',
  BUY = 'buy',
}

export enum UnitType {
  // RENT — Residential
  BEDSITTER = 'Bedsitter',
  ONE_BEDROOM = '1 Bedroom',
  TWO_BEDROOM = '2 Bedroom',
  THREE_BEDROOM = '3 Bedroom',
  FOUR_BEDROOM = '4 Bedroom',
  OWN_COMPOUND = 'Own Compound',
  // RENT — Short Stay / B&B
  AIRBNB = 'Airbnb',
  BNB = 'B&B',
  GUEST_ROOM = 'Guest Room',
  CAMPSITE = 'Campsite',
  // RENT — Commercial
  BUSINESS_HOUSE = 'Nyumba ya Biashara',
  // RENT — Farmland
  FARMLAND_RENT = 'Farmland (Rent)',
  // BUY — Property
  PROPERTY_SALE = 'Property for Sale',
  // BUY — Land
  LAND_SALE = 'Land for Sale',
  FARMLAND_SALE = 'Farmland for Sale',
}

// Convenience groupings for filtering
export const RENT_UNIT_TYPES: UnitType[] = [
  UnitType.BEDSITTER,
  UnitType.ONE_BEDROOM,
  UnitType.TWO_BEDROOM,
  UnitType.THREE_BEDROOM,
  UnitType.FOUR_BEDROOM,
  UnitType.OWN_COMPOUND,
  UnitType.AIRBNB,
  UnitType.BNB,
  UnitType.GUEST_ROOM,
  UnitType.CAMPSITE,
  UnitType.BUSINESS_HOUSE,
  UnitType.FARMLAND_RENT,
];

export const BUY_UNIT_TYPES: UnitType[] = [
  UnitType.PROPERTY_SALE,
  UnitType.LAND_SALE,
  UnitType.FARMLAND_SALE,
];

export const SHORT_STAY_UNIT_TYPES: UnitType[] = [
  UnitType.AIRBNB,
  UnitType.BNB,
  UnitType.GUEST_ROOM,
  UnitType.CAMPSITE,
];

export type PaymentMethod = 'mpesa' | 'mpesa-till' | 'airtel' | 'card';

export type AuthStep = 'welcome' | 'signup' | 'login';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ListingAmenities {
  wifi?: boolean;
  water?: boolean;
  electricity?: boolean;
  security?: boolean;
  generator?: boolean;
  swimmingPool?: boolean;
  gym?: boolean;
  borehole?: boolean;
  solarPower?: boolean;
  cctv?: boolean;
}

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  buildingName?: string;
  description: string;
  unitType: UnitType;
  // category defaults to 'rent' for backward compatibility with existing listings
  category?: ListingCategory;
  price: number;
  deposit: number;
  // 'once' is used for sale listings (property/land sold at a one-time price)
  pricePeriod: 'monthly' | 'nightly' | 'once';
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromTown: number;
  photos: string[];
  isVacant: boolean;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  isVerified: boolean;
  reviews: Review[];
  dateListed: string;
  subscriptionExpiry?: string;
  hasParking: boolean;
  isPetsFriendly: boolean;
  // New fields for land/farm listings
  landSize?: string;        // e.g. "2 acres", "0.5 hectares"
  titleDeed?: boolean;      // whether title deed is available for sale listings
  amenities?: ListingAmenities;
}

export interface SavedSearch {
  id: string;
  query: string;
  unitType: UnitType | 'All';
  dateSaved: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  unlockedListings: string[];
  favorites: string[];
  savedSearches: SavedSearch[];
  isEncrypted: boolean;
  logoUrl?: string;
}

// --- Seller Lead (for the /sell page form submissions) ---
export interface SellerLead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  propertyType: string;
  location: string;
  description: string;
  askingPrice?: number;
  photoUrls?: string[];
  submittedAt: string;
  status: 'pending' | 'contacted' | 'listed';
}
