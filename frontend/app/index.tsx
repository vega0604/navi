import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent } from '@/components/MapComponent';
import { BottomSheet } from '@/components/BottomSheet';
import { SettingsModal } from '@/components/SettingsModal';
import { VoiceOverPlacesList } from '@/components/VoiceOverPlacesList';
import { PlaceDetailsScreen } from '@/components/PlaceDetailsScreen';
import { useMainScreen } from '@/hooks/useMainScreen';
import { mockLocations } from '@/data/mockLocations';
import { router, type Href } from 'expo-router';
import { searchPlaces } from '@/services/placesApi';

interface Location {
  id: string;
  name: string;
  distance: string;
  category: string;
  disabilityCategory: {
    [key: string]: number;
  };
}

export default function MainScreen() {
  const {
    location,
    errorMsg,
    clickedPoi,
    placeDetails,
    nearbyPlaces,
    searchText,
    preferredDisabilityCategories,
    showSettingsModal,
    isFirstTime,
    isSheetExpanded,
    isVoiceOverEnabled,
    mapRef,
    bottomSheetHeight,
    scrollY,
    setSearchText,
    setErrorMsg,
    toggleDisabilityPreference,
    closeSettingsModal,
    handlePoiClick,
    expandSheet,
    setShowSettingsModal,
    panHandlers,
  } = useMainScreen();

  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handlePlaceSelect = (place: Location) => {
    setSelectedPlace(place);
  };

  const handleBackFromDetails = () => {
    setSelectedPlace(null);
  };

  // Local search fallback function
  const performLocalSearch = useCallback((query: string) => {
    const searchTerm = query.toLowerCase().trim();
    return nearbyPlaces.filter(place => 
      place.name.toLowerCase().includes(searchTerm) ||
      place.category.toLowerCase().includes(searchTerm)
    );
  }, [nearbyPlaces]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Starting search for:', query);
    
    try {
      // Try Places API search first
      const apiResults = await searchPlaces(
        query,
        location?.coords.latitude,
        location?.coords.longitude
      );
      
      console.log('📡 API search results:', apiResults.length, 'places found');
      
      // If API returns no results, try local search as fallback
      if (apiResults.length === 0) {
        console.log('🔄 No API results, trying local search...');
        const localResults = performLocalSearch(query);
        console.log('📍 Local search results:', localResults.length, 'places found');
        setSearchResults(localResults);
      } else {
        setSearchResults(apiResults);
      }
    } catch (error) {
      console.error('❌ Search error, falling back to local search:', error);
      // Fallback to local search if API fails
      const localResults = performLocalSearch(query);
      console.log('📍 Fallback local search results:', localResults.length, 'places found');
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  }, [location, performLocalSearch]);

  // Handle search text changes with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchText.trim()) {
      const timeout = setTimeout(() => {
        performSearch(searchText);
      }, 500); // 500ms debounce
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchText, performSearch]);

  // Determine which locations to display
  const displayLocations = searchText.trim() ? searchResults : nearbyPlaces;

  // Show full-screen place details if a place is selected
  if (selectedPlace) {
    return (
      <PlaceDetailsScreen 
        place={selectedPlace}
        preferredDisabilityCategories={preferredDisabilityCategories}
        onBack={handleBackFromDetails}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isVoiceOverEnabled ? (
        // VoiceOver-optimized view: Only show places list
        <VoiceOverPlacesList
          nearbyPlaces={nearbyPlaces}
          preferredDisabilityCategories={preferredDisabilityCategories}
          onSettingsPress={() => setShowSettingsModal(true)}
          onCameraPress={() => router.push('/camera-back' as Href)}
          onMicPress={() => {
            // TODO: Implement voice functionality
            console.log('Mic button pressed');
          }}
        />
      ) : (
        // Standard view: Map + Bottom Sheet
        <>
          <MapComponent
            mapRef={mapRef}
            location={location}
            errorMsg={errorMsg}
            clickedPoi={clickedPoi}
            nearbyPlaces={nearbyPlaces}
            onPoiClick={handlePoiClick}
            onMarkerPress={handlePlaceSelect}
            onSettingsPress={() => setShowSettingsModal(true)}
            setErrorMsg={setErrorMsg}
          />
          
          <BottomSheet
            bottomSheetHeight={bottomSheetHeight}
            searchText={searchText}
            setSearchText={setSearchText}
            mockLocations={displayLocations}
            isSearching={isSearching}
            preferredDisabilityCategories={preferredDisabilityCategories}
            isSheetExpanded={isSheetExpanded}
            expandSheet={expandSheet}
            scrollY={scrollY}
            panHandlers={panHandlers}
            onPlaceSelect={handlePlaceSelect}
          />
        </>
      )}
      
      <SettingsModal
        showSettingsModal={showSettingsModal}
        preferredDisabilityCategories={preferredDisabilityCategories}
        isFirstTime={isFirstTime}
        toggleDisabilityPreference={toggleDisabilityPreference}
        closeSettingsModal={closeSettingsModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
