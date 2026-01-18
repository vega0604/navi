import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent } from '@/components/MapComponent';
import { BottomSheet } from '@/components/BottomSheet';
import { SettingsModal } from '@/components/SettingsModal';
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
