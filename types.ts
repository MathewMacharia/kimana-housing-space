
export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD'
}

export enum UnitType {
  BEDSITTER = 'Bedsitter',
  ONE_BEDROOM = '1 Bedroom',
  TWO_BEDROOM = '2 Bedroom',
  THREE_BEDROOM = '3 Bedroom',
  FOUR_BEDROOM = '4 Bedroom',
  OWN_COMPOUND = 'Own Compound',
  AIRBNB = 'Airbnb',
  BUSINESS_HOUSE = 'Nyumba ya Biashara'
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  unitType: UnitType;
  price: number;
  deposit: number;
  pricePeriod: 'monthly' | 'nightly';
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromTown: number;
  photos: string[];
  isVacant: boolean;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  isVerified: boolean;
  reviews: Review[];
  dateListed: string;
  subscriptionExpiry?: string;
  hasParking: boolean;
  isPetsFriendly: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  unlockedListings: string[];
  isEncrypted: boolean;
}
