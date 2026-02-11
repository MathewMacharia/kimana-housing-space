
import { Listing, UnitType, Review } from './types';

const generateMockImages = (seed: string, count: number) => 
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}${i}/800/600`);

export const KIMANA_LOCATIONS = [
  'Town Centre',
  'Katoo Stadium Route',
  'Church on the Rock',
  'PEFA Church Area',
  'Korir Hospital Area',
  'Kwa Mnara',
  'Old Equity',
  'Rosama Area',
  'Shanturi Area',
  'New Equity Bank Area',
  'Likizo Resort Area',
  'Nkadayo',
  'Full Gospel Area',
  'Blay Area',
  'Siro Nosim Area'
];

const mockReviews: Review[] = [
  {
    id: 'r1',
    userId: 't1',
    userName: 'Mercy Wanjiku',
    rating: 5,
    comment: 'Very secure place and the landlord is very understanding. Highly recommend!',
    date: '2024-03-15'
  },
  {
    id: 'r2',
    userId: 't2',
    userName: 'David Kipkorir',
    rating: 4,
    comment: 'The water supply is constant as advertised. Close to town center.',
    date: '2024-03-10'
  }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    landlordId: 'l1',
    title: 'Modern 2-Bedroom near Kimana Center',
    description: 'Beautiful 2-bedroom apartment with constant water supply, secure parking, and tiled floors. Just walking distance to the main road. The compound is quiet and highly secure with 24/7 guard.',
    unitType: UnitType.TWO_BEDROOM,
    price: 15000,
    deposit: 15000,
    pricePeriod: 'monthly',
    locationName: 'Town Centre',
    coordinates: { lat: -2.7183, lng: 37.5256 },
    distanceFromTown: 0.5,
    photos: generateMockImages('house1', 8),
    isVacant: true,
    landlordName: 'John Mweru',
    landlordPhone: '+254 712 345 678',
    landlordEmail: 'john@kimana-agency.com',
    isVerified: true,
    reviews: mockReviews,
    dateListed: '2024-03-01',
    hasParking: true,
    isPetsFriendly: false
  },
  {
    id: '2',
    landlordId: 'l2',
    title: 'Cozy Airbnb with Kilimanjaro View',
    description: 'Perfect for weekend getaways. Fully furnished with high-speed WiFi and amazing views of the mountain. Includes a fully equipped kitchenette.',
    unitType: UnitType.AIRBNB,
    price: 3500,
    deposit: 0,
    pricePeriod: 'nightly',
    locationName: 'Likizo Resort Area',
    coordinates: { lat: -2.7250, lng: 37.5300 },
    distanceFromTown: 3.2,
    photos: generateMockImages('house3', 8),
    isVacant: true,
    landlordName: 'Sarah Kimani',
    landlordPhone: '+254 722 000 111',
    landlordEmail: 'sarah.k@gmail.com',
    isVerified: true,
    reviews: [
      {
        id: 'r3',
        userId: 't3',
        userName: 'Peter Maina',
        rating: 5,
        comment: 'Breathtaking views! The host was very helpful during my stay.',
        date: '2024-03-12'
      }
    ],
    subscriptionExpiry: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    dateListed: '2024-03-05',
    hasParking: true,
    isPetsFriendly: true
  },
  {
    id: '3',
    landlordId: 'l3',
    title: 'Premium Stall - Kimana Main Market',
    description: 'Strategic business space in the heart of Kimana. Ideal for retail, electronics, or a boutique. High foot traffic and secure lockable gates.',
    unitType: UnitType.BUSINESS_HOUSE,
    price: 8000,
    deposit: 8000,
    pricePeriod: 'monthly',
    locationName: 'Old Equity',
    coordinates: { lat: -2.7150, lng: 37.5210 },
    distanceFromTown: 0.2,
    photos: generateMockImages('business1', 8),
    isVacant: true,
    landlordName: 'David Kiptoo',
    landlordPhone: '+254 700 999 888',
    landlordEmail: 'david.k@bizspace.ke',
    isVerified: true,
    reviews: [],
    dateListed: '2024-03-10',
    hasParking: false,
    isPetsFriendly: false
  }
];

export const UNLOCK_FEE_STANDARD = 50;
export const UNLOCK_FEE_AIRBNB = 100;
export const UNLOCK_FEE_BUSINESS = 100;

export const LISTING_FEE_STANDARD = 100;
export const LISTING_FEE_AIRBNB_MONTHLY = 1000;
export const LISTING_FEE_BUSINESS = 150;
