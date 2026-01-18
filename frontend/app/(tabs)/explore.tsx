import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error('Location error:', error);
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setErrorMsg(null);
            // Retry location request
          }}
        >
          <ThemedText style={styles.retryText}>Retry Location Access</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const renderMap = () => {
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

    // Native map for iOS and Android
    return (
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}
    </View>
  );
}

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
  note: {
    marginTop: 40,
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 12,
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
});
