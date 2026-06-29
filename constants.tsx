
import { Listing, UnitType, ListingCategory, Review } from './types';

const generateMockImages = (seed: string, count: number) =>
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}${i}/800/600`);

export const LOCATIONS_HIERARCHY = {
  'Kimana': [
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
  ],
  'Loitokitok': [
    'Town Centre (LTK)',
    'Kamukunji',
    'Majengo',
    'Inkisanjani',
    'Entonet Route',
    'Ilitilal Route',
    'Kandile Area',
    'Kimana Road Gate',
    'Hospital Zone',
    'Police Station Area',
    'National Oil',
    'Bondeni',
    'Kwa Maji',
    'Custom',
    'Mountain (Oloitokitok Boys Route)',
    'Patipati'
  ],
  'Illasit': [
    'Town Centre',
    'Market Area',
    'Border Point',
    'Residential Zone A',
    'Residential Zone B'
  ],
  'Simba Cement': [
    'Factory Gate Area',
    'Staff Quarters',
    'Main Road Junction',
    'Trading Centre'
  ]
};

// Legacy exports removed. Only LOCATIONS_HIERARCHY is used.

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
    title: 'Modern 2-Bedroom',
    buildingName: 'Riverside Apartments',
    description: 'Beautiful 2-bedroom apartment with constant water supply, secure parking, and tiled floors. Just walking distance to the main road. The compound is quiet and highly secure with 24/7 guard.',
    unitType: UnitType.TWO_BEDROOM,
    category: ListingCategory.RENT,
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
    isPetsFriendly: false,
    amenities: { water: true, electricity: true, security: true }
  },
  {
    id: '2',
    landlordId: 'l2',
    title: 'Kilimanjaro View B&B',
    buildingName: 'Kilimanjaro Heights',
    description: 'Stunning views of Kilimanjaro from the balcony. Located in a high-altitude area of Loitokitok with fresh air, a warm breakfast, and ultimate privacy. Perfect for weekend getaways.',
    unitType: UnitType.BNB,
    category: ListingCategory.RENT,
    price: 4500,
    deposit: 0,
    pricePeriod: 'nightly',
    locationName: 'Hospital Zone',
    coordinates: { lat: -2.7450, lng: 37.5100 },
    distanceFromTown: 1.2,
    photos: generateMockImages('houseLTK', 8),
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
        comment: 'Best altitude experience! The weather in Loitokitok is refreshing.',
        date: '2024-03-12'
      }
    ],
    subscriptionExpiry: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    dateListed: '2024-03-05',
    hasParking: true,
    isPetsFriendly: true,
    amenities: { wifi: true, water: true, electricity: true }
  },
  {
    id: '3',
    landlordId: 'l3',
    title: 'Premium Business Stall',
    buildingName: 'Kimana Main Market Plaza',
    description: 'Strategic business space in the heart of Kimana. Ideal for retail, electronics, or a boutique. High foot traffic and secure lockable gates.',
    unitType: UnitType.BUSINESS_HOUSE,
    category: ListingCategory.RENT,
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
    isPetsFriendly: false,
    amenities: { electricity: true, security: true, cctv: true }
  },
  {
    id: '4',
    landlordId: 'l4',
    title: '2-Acre Prime Farmland',
    description: 'Fertile 2-acre farmland available for lease near the Kimana wetlands. Ideal for horticulture, irrigation farming, or livestock. Has a borehole on-site and good road access.',
    unitType: UnitType.FARMLAND_RENT,
    category: ListingCategory.RENT,
    price: 12000,
    deposit: 12000,
    pricePeriod: 'monthly',
    locationName: 'Nkadayo',
    coordinates: { lat: -2.7300, lng: 37.5400 },
    distanceFromTown: 3.5,
    photos: generateMockImages('farm1', 8),
    isVacant: true,
    landlordName: 'James Nkadayo',
    landlordPhone: '+254 711 222 333',
    landlordEmail: 'james.n@farms.ke',
    isVerified: true,
    reviews: [],
    dateListed: '2024-04-01',
    hasParking: false,
    isPetsFriendly: true,
    landSize: '2 acres',
    amenities: { water: true, borehole: true }
  },
  {
    id: '5',
    landlordId: 'l5',
    title: 'Prime Residential Plot',
    description: '50x100 ft residential plot in a fast-developing area of Kimana Town. Title deed ready. Ideal for building your dream home. Electricity available at the plot boundary.',
    unitType: UnitType.LAND_SALE,
    category: ListingCategory.BUY,
    price: 850000,
    deposit: 0,
    pricePeriod: 'once',
    locationName: 'Kwa Mnara',
    coordinates: { lat: -2.7200, lng: 37.5300 },
    distanceFromTown: 1.0,
    photos: generateMockImages('land1', 8),
    isVacant: true,
    landlordName: 'Grace Wambua',
    landlordPhone: '+254 733 444 555',
    landlordEmail: 'grace.w@land.ke',
    isVerified: true,
    reviews: [],
    dateListed: '2024-04-05',
    hasParking: false,
    isPetsFriendly: false,
    landSize: '50x100 ft',
    titleDeed: true
  },
  {
    id: '6',
    landlordId: 'l6',
    title: '3-Bedroom Family Home',
    buildingName: 'Rosama Estate',
    description: 'Fully completed 3-bedroom maisonette in a gated community. Has a spacious compound with garden, solar water heater, and backup borehole. Title deed available.',
    unitType: UnitType.PROPERTY_SALE,
    category: ListingCategory.BUY,
    price: 6500000,
    deposit: 0,
    pricePeriod: 'once',
    locationName: 'Rosama Area',
    coordinates: { lat: -2.7100, lng: 37.5180 },
    distanceFromTown: 1.5,
    photos: generateMockImages('property1', 8),
    isVacant: true,
    landlordName: 'Peter Waweru',
    landlordPhone: '+254 722 777 888',
    landlordEmail: 'peter.w@homes.ke',
    isVerified: true,
    reviews: [],
    dateListed: '2024-04-10',
    hasParking: true,
    isPetsFriendly: true,
    titleDeed: true,
    amenities: { water: true, electricity: true, security: true, solarPower: true, borehole: true }
  }
];

// --- Unlock Fees (KES) ---
export const UNLOCK_FEE_STANDARD = 50;        // Residential rentals
export const UNLOCK_FEE_AIRBNB = 100;          // Airbnb
export const UNLOCK_FEE_BNB = 100;             // B&B listings
export const UNLOCK_FEE_BUSINESS = 50;         // Commercial rentals
export const UNLOCK_FEE_SHORT_STAY = 100;      // Guest rooms / campsites
export const UNLOCK_FEE_FARMLAND = 50;         // Farmland rent
export const UNLOCK_FEE_LAND_SALE = 150;       // Land for sale
export const UNLOCK_FEE_PROPERTY_SALE = 200;   // Property for sale

// --- Listing Fees (KES) ---
export const LISTING_FEE_STANDARD = 100;
export const LISTING_FEE_AIRBNB_MONTHLY = 300;
export const LISTING_FEE_BNB_MONTHLY = 300;
export const LISTING_FEE_BUSINESS = 150;
export const LISTING_FEE_SHORT_STAY_PREMIUM = 300;
export const LISTING_FEE_FARMLAND = 150;
export const LISTING_FEE_LAND_SALE = 200;
export const LISTING_FEE_PROPERTY_SALE = 500;
