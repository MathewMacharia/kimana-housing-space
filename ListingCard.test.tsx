
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ListingCard from './components/ListingCard';
import { Listing, UnitType } from './types';

const mockListing: Listing = {
    id: '1',
    landlordId: 'l1',
    title: 'Test Listing',
    buildingName: 'Test Building',
    description: 'Test Description',
    unitType: UnitType.ONE_BEDROOM,
    price: 1000,
    deposit: 1000,
    pricePeriod: 'monthly',
    locationName: 'Test Location',
    coordinates: { lat: 0, lng: 0 },
    distanceFromTown: 1,
    photos: [],
    isVacant: true,
    landlordName: 'Test Landlord',
    landlordPhone: '123456789',
    landlordEmail: 'test@test.com',
    isVerified: true,
    reviews: [],
    dateListed: '2024-01-01',
    hasParking: true,
    isPetsFriendly: true
};

describe('ListingCard', () => {
    it('renders listing title', () => {
        render(<ListingCard listing={mockListing} onClick={() => { }} />);
        const titleElement = screen.getByText(/Test Listing/i);
        expect(titleElement).toBeInTheDocument();
    });

    it('renders price correctly', () => {
        render(<ListingCard listing={mockListing} onClick={() => { }} />);
        // The component uses 'Ksh' and toLocaleString()
        const priceElement = screen.getByText(/Ksh 1,000/i);
        expect(priceElement).toBeInTheDocument();
    });
});
