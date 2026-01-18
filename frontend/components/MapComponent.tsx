import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import SettingsIcon from '@/assets/icons/settings_black.svg';
import EmergencyIcon from '@/assets/icons/emergency.svg';

interface MapComponentProps {
  mapRef: React.RefObject<MapView | null>;
  location: Location.LocationObject | null;
  errorMsg: string | null;
  clickedPoi: {
    coordinate: { latitude: number; longitude: number };
    name: string;
    placeId: string;
  } | null;
  nearbyPlaces?: any[];
  onPoiClick: (event: any) => void;
  onMarkerPress?: (place: any) => void;
  onSettingsPress: () => void;
  setErrorMsg: (msg: string | null) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  mapRef,
  location,
  errorMsg,
  clickedPoi,
  nearbyPlaces = [],
  onPoiClick,
  onMarkerPress,
  onSettingsPress,
  setErrorMsg
}) => {
  // Animate to user location once when available
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800 // smooth animation
      );
    }
  }, [location]);

  if (errorMsg) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setErrorMsg(null);
            // Retry location request will be handled by the hook
          }}
        >
          <ThemedText style={styles.retryText}>Retry Location Access</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (Platform.OS === 'web') {
    // Web fallback
    return (
      <ThemedView style={styles.mapPlaceholder}>
        <ThemedText type="title" style={styles.mapTitle}>Map View</ThemedText>
        <ThemedText style={styles.mapSubtitle}>
          Maps are only available on Android and iOS
        </ThemedText>
        
        {location && (
          <ThemedView style={styles.locationInfo}>
            <ThemedText type="subtitle">Your Location:</ThemedText>
            <ThemedText>
              Lat: {location.coords.latitude.toFixed(6)}
            </ThemedText>
            <ThemedText>
              Lng: {location.coords.longitude.toFixed(6)}
            </ThemedText>
            <ThemedText>
              Accuracy: ±{location.coords.accuracy?.toFixed(0)}m
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider="google" // Force Google Maps on iOS
        style={styles.map}
        initialRegion={{
          latitude: 43.5890,
          longitude: -79.6441,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        showsPointsOfInterest
        onPoiClick={onPoiClick}
      >
        {/* Red marker for clicked POI */}
        {clickedPoi && (
          <Marker
            key={clickedPoi.placeId}
            coordinate={clickedPoi.coordinate}
            title={clickedPoi.name}
            description={`Place ID: ${clickedPoi.placeId}`}
            pinColor="red"
            tracksViewChanges={false}
          />
        )}
      </MapView>
      
      {/* Emergency Button */}
      <TouchableOpacity style={styles.emergencyButton}>
        <EmergencyIcon width={39} height={39} fill="#000000" />
      </TouchableOpacity>
      
      {/* Settings Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
      >
        <SettingsIcon width={36.98} height={36.98} fill="#000000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  mapSubtitle: {
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  locationInfo: {
    marginTop: 30,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  emergencyButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
