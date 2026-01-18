import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent } from '@/components/MapComponent';
import { BottomSheet } from '@/components/BottomSheet';
import { SettingsModal } from '@/components/SettingsModal';
import { VoiceOverPlacesList } from '@/components/VoiceOverPlacesList';
import { useMainScreen } from '@/hooks/useMainScreen';
import { mockLocations } from '@/data/mockLocations';

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

  return (
    <View style={styles.container}>
      {isVoiceOverEnabled ? (
        // VoiceOver-optimized view: Only show places list
        <VoiceOverPlacesList
          nearbyPlaces={nearbyPlaces}
          preferredDisabilityCategories={preferredDisabilityCategories}
          onSettingsPress={() => setShowSettingsModal(true)}
          onCameraPress={() => {
            // TODO: Implement camera functionality
            console.log('Camera button pressed');
          }}
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
            onPoiClick={handlePoiClick}
            onSettingsPress={() => setShowSettingsModal(true)}
            setErrorMsg={setErrorMsg}
          />
          
          <BottomSheet
            bottomSheetHeight={bottomSheetHeight}
            searchText={searchText}
            setSearchText={setSearchText}
            mockLocations={nearbyPlaces}
            preferredDisabilityCategories={preferredDisabilityCategories}
            isSheetExpanded={isSheetExpanded}
            expandSheet={expandSheet}
            scrollY={scrollY}
            panHandlers={panHandlers}
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
