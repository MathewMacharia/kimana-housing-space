import { render, screen } from '@testing-library/react';
import ListingCard from './components/ListingCard';
import { Listing, UnitType } from './types';

const mockListing: Listing = {
    id: '1',
    landlordId: 'landlord1',
    title: 'Luxury Kimana Villa',
    description: 'A beautiful villa',
    unitType: UnitType.THREE_BEDROOM,
    price: 500000,
    deposit: 100000,
    pricePeriod: 'monthly',
    locationName: 'Kimana',
    coordinates: { lat: 0, lng: 0 },
    distanceFromTown: 5,
    photos: ['https://example.com/photo.jpg'],
    isVacant: true,
    landlordName: 'John Doe',
    landlordPhone: '1234567890',
    landlordEmail: 'john@example.com',
    isVerified: true,
    reviews: [],
    dateListed: new Date().toISOString(),
    hasParking: true,
    isPetsFriendly: false
};

test('it displays the house title and price', () => {
    render(<ListingCard listing={mockListing} onClick={() => { }} />);

    expect(screen.getByText('Luxury Kimana Villa')).toBeInTheDocument();
    expect(screen.getByText(/Ksh 500,000/)).toBeInTheDocument();
});