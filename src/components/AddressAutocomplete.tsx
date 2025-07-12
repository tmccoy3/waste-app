'use client';

import React, { useRef, useEffect } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange: (coordinates: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Start typing an address...",
  className = "",
  required = false
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' }
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place.geometry && place.geometry.location) {
            onChange(place.formatted_address || '');
            onCoordinatesChange({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          } else {
            onCoordinatesChange(null);
          }
        });
      }
    };

    // Check if Google Maps is already loaded
    if (window.google) {
      initializeAutocomplete();
    } else {
      // Wait for Google Maps to load
      window.initAutocomplete = initializeAutocomplete;
      
      // Load Google Maps API if not already loaded
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, onCoordinatesChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // Clear coordinates when user types manually
    if (e.target.value === '') {
      onCoordinatesChange(null);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent ${className}`}
      required={required}
    />
  );
} 