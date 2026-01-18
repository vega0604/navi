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
    searchText,
    preferredDisabilityCategories,
    showSettingsModal,
    isFirstTime,
    mapRef,
    bottomSheetHeight,
    setSearchText,
    setErrorMsg,
    toggleDisabilityPreference,
    closeSettingsModal,
    handlePoiClick,
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
        mockLocations={mockLocations}
        preferredDisabilityCategories={preferredDisabilityCategories}
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
