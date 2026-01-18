// Google Places API service
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface PlacePhoto {
  photoReference: string;
  height: number;
  width: number;
  htmlAttributions: string[];
}

export interface PlaceReview {
  authorName: string;
  authorUrl?: string;
  language: string;
  profilePhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  priceLevel?: number;
  businessStatus?: string;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  openingHours?: {
    openNow: boolean;
    weekdayText: string[];
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
}

export const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key not found. Please check your .env file.');
      return null;
    }
    
    console.log('🔍 Fetching place details for:', placeId);
    
    const fields = [
      'place_id',
      'name', 
      'formatted_address',
      'formatted_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'types',
      'price_level',
      'business_status',
      'photos',
      'reviews',
      'opening_hours'
    ].join(',');

    const url = `${PLACES_API_BASE_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;
    
    console.log('📡 Making API request to Places API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Places API response:', data);
    
    if (data.status !== 'OK') {
      console.error('❌ Places API error:', data.status, data.error_message);
      return null;
    }

    const result = data.result;
    
    const placeDetails: PlaceDetails = {
      placeId: result.place_id,
      name: result.name || 'Unknown Place',
      address: result.formatted_address || 'Address not available',
      phone: result.formatted_phone_number,
      website: result.website,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      types: result.types || [],
      priceLevel: result.price_level,
      businessStatus: result.business_status,
      photos: result.photos?.map((photo: any) => ({
        photoReference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
        htmlAttributions: photo.html_attributions || []
      })),
      reviews: result.reviews?.map((review: any) => ({
        authorName: review.author_name,
        authorUrl: review.author_url,
        language: review.language,
        profilePhotoUrl: review.profile_photo_url,
        rating: review.rating,
        relativeTimeDescription: review.relative_time_description,
        text: review.text,
        time: review.time
      })),
      openingHours: result.opening_hours ? {
        openNow: result.opening_hours.open_now,
        weekdayText: result.opening_hours.weekday_text || [],
        periods: result.opening_hours.periods?.map((period: any) => ({
          open: { day: period.open.day, time: period.open.time },
          close: period.close ? { day: period.close.day, time: period.close.time } : undefined
        }))
      } : undefined
    };

    console.log('📍 Parsed place details:', placeDetails);
    return placeDetails;
    
  } catch (error) {
    console.error('❌ Error fetching place details:', error);
    return null;
  }
};

// Helper function to get photo URL from photo reference
export const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  return `${PLACES_API_BASE_URL}/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Interface for nearby places (simplified for list display)
export interface NearbyPlace {
  id: string;
  name: string;
  distance: string;
  category: string;
  placeId: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  disabilityCategory: {
    'Mobility Impairment': number;
    'Visual Impairment': number;
    'Light Sensitivity': number;
    'Sound Sensitivity': number;
    'Chronic Fatigue': number;
    'Respiratory Issues': number;
  };
}

// Fetch nearby places using Google Places Nearby Search
export const fetchNearbyPlaces = async (
  latitude: number, 
  longitude: number, 
  radius: number = 2000
): Promise<NearbyPlace[]> => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key not found. Please check your .env file.');
      return [];
    }
    
    console.log('🔍 Fetching nearby places for:', { latitude, longitude, radius });
    
    const url = `${PLACES_API_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}`;
    
    console.log('📡 Making Nearby Search API request...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Nearby Search API response:', data);
    
    if (data.status !== 'OK') {
      console.error('❌ Nearby Search API error:', data.status, data.error_message);
      return [];
    }

    // Convert Google Places results to our format
    const nearbyPlaces: NearbyPlace[] = data.results.slice(0, 10).map((place: any, index: number) => {
      // Calculate approximate distance (simplified)
      const distance = calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng);
      
      // Determine category from place types
      const category = getCategoryFromTypes(place.types || []);
      
      return {
        id: (index + 1).toString(),
        name: place.name || 'Unknown Place',
        distance: `${distance.toFixed(1)} km`,
        category: category,
        placeId: place.place_id,
        coordinate: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        disabilityCategory: {
          'Mobility Impairment': 0,
          'Visual Impairment': 0,
          'Light Sensitivity': 0,
          'Sound Sensitivity': 0,
          'Chronic Fatigue': 0,
          'Respiratory Issues': 0,
        }
      };
    });

    console.log('📍 Parsed nearby places:', nearbyPlaces);
    return nearbyPlaces;
    
  } catch (error) {
    console.error('❌ Error fetching nearby places:', error);
    return [];
  }
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Search for places using Google Places Text Search
export const searchPlaces = async (
  query: string,
  latitude?: number,
  longitude?: number,
  radius: number = 5000
): Promise<NearbyPlace[]> => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key not found. Please check your .env file.');
      return [];
    }
    
    if (!query.trim()) {
      return [];
    }
    
    console.log('🔍 Searching places for:', query);
    
    let url = `${PLACES_API_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    // Add location bias if coordinates are provided
    if (latitude && longitude) {
      url += `&location=${latitude},${longitude}&radius=${radius}`;
      console.log('📍 Using location bias:', latitude, longitude, 'radius:', radius);
    }
    
    console.log('📡 Making Places Text Search API request to:', url.replace(GOOGLE_PLACES_API_KEY || '', '[API_KEY]'));
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Places Text Search API response:', data);
    
    if (data.status !== 'OK') {
      console.error('❌ Places Text Search API error:', data.status, data.error_message);
      return [];
    }

    // Convert Google Places results to our format
    const searchResults: NearbyPlace[] = data.results.slice(0, 10).map((place: any, index: number) => {
      // Calculate approximate distance if user location is provided
      let distance = 0;
      if (latitude && longitude && place.geometry?.location) {
        distance = calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng);
      }
      
      // Determine category from place types
      const category = getCategoryFromTypes(place.types || []);
      
      return {
        id: `search_${index + 1}`,
        name: place.name || 'Unknown Place',
        distance: distance > 0 ? `${distance.toFixed(1)} km` : 'Unknown distance',
        category: category,
        placeId: place.place_id,
        coordinate: {
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0
        },
        disabilityCategory: {
          'Mobility Impairment': 0,
          'Visual Impairment': 0,
          'Light Sensitivity': 0,
          'Sound Sensitivity': 0,
          'Chronic Fatigue': 0,
          'Respiratory Issues': 0,
        }
      };
    });

    console.log('📍 Parsed search results:', searchResults);
    return searchResults;
    
  } catch (error) {
    console.error('❌ Error searching places:', error);
    return [];
  }
};

// Helper function to determine category from Google Place types
const getCategoryFromTypes = (types: string[]): string => {
  const categoryMap: { [key: string]: string } = {
    'restaurant': 'Restaurant',
    'food': 'Restaurant',
    'meal_takeaway': 'Restaurant',
    'store': 'Store',
    'shopping_mall': 'Shopping',
    'park': 'Park',
    'tourist_attraction': 'Attraction',
    'hospital': 'Healthcare',
    'school': 'Education',
    'university': 'Education',
    'gas_station': 'Gas Station',
    'bank': 'Finance',
    'pharmacy': 'Healthcare'
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  
  return 'Place';
};
