import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Animated, PanResponder, Dimensions, FlatList, TextInput } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MicIcon from '@/assets/icons/mic.svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 100;

export default function MainScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clickedPoi, setClickedPoi] = useState<{
    coordinate: { latitude: number; longitude: number };
    name: string;
    placeId: string;
  } | null>(null);
  const [searchText, setSearchText] = useState('');
  
  const mapRef = useRef<MapView>(null);
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;

  const mockLocations = [
    {
      id: '1',
      name: 'Central Library',
      distance: '0.2 miles',
      accessibilityScore: 4.5,
      category: 'Library',
    },
    {
      id: '2',
      name: 'City Park',
      distance: '0.4 miles',
      accessibilityScore: 3.8,
      category: 'Park',
    },
    {
      id: '3',
      name: 'Metro Station',
      distance: '0.6 miles',
      accessibilityScore: 4.2,
      category: 'Transportation',
    },
    {
      id: '4',
      name: 'Community Center',
      distance: '0.8 miles',
      accessibilityScore: 4.7,
      category: 'Community',
    },
  ];

  // Pan responder for bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        const newHeight = BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy;
        if (newHeight >= BOTTOM_SHEET_MIN_HEIGHT && newHeight <= BOTTOM_SHEET_MAX_HEIGHT) {
          bottomSheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocity = gestureState.vy;
        const currentHeight = BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy;
        
        if (velocity < -0.5 || currentHeight > BOTTOM_SHEET_MAX_HEIGHT * 0.5) {
          // Expand
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MAX_HEIGHT,
            useNativeDriver: false,
          }).start();
        } else {
          // Collapse
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MIN_HEIGHT,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handlePoiClick = (event: any) => {
    const { coordinate, placeId, name } = event.nativeEvent;
    console.log('POI clicked:', {
      name: name,
      placeId: placeId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
    
    // Clear marker first (disappear effect)
    setClickedPoi(null);
    
    // Then show new marker after brief delay (pop effect)
    setTimeout(() => {
      setClickedPoi({
        coordinate,
        name,
        placeId
      });
    }, 100);
  };

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
      } catch (error) {
        setErrorMsg('Error getting location');
        console.error('Location error:', error);
      }
    })();
  }, []);

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

    return (
      <MapView
        ref={mapRef}
        provider="google"
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        showsPointsOfInterest
        onPoiClick={handlePoiClick}
      >
        {/* Red marker for clicked POI */}
        {clickedPoi && (
          <Marker
            coordinate={clickedPoi.coordinate}
            title={clickedPoi.name}
            description={`Place ID: ${clickedPoi.placeId}`}
            pinColor="red"
          />
        )}
      </MapView>
    );
  };

  const renderLocationItem = ({ item }: { item: typeof mockLocations[0] }) => (
    <TouchableOpacity style={styles.locationItem}>
      <ThemedView style={styles.locationContent}>
        <ThemedText type="subtitle" style={styles.locationName}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.locationDetails}>
          {item.category} • {item.distance}
        </ThemedText>
        <ThemedText style={styles.accessibilityScore}>
          Accessibility Score: {item.accessibilityScore}/5
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderBottomSheetContent = () => {
    return (
      <View style={styles.bottomSheetContent}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.micButton}>
            <MicIcon />
          </TouchableOpacity>
        </View>
        <FlatList
          data={mockLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          style={styles.locationsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}
      
      {/* Bottom Sheet */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          { height: bottomSheetHeight }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />
        
        {/* Content */}
        {renderBottomSheetContent()}
      </Animated.View>
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
  // Bottom Sheet Styles
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomSheetTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  locationName: {
    marginBottom: 4,
  },
  locationDetails: {
    marginBottom: 8,
    opacity: 0.7,
  },
  accessibilityScore: {
    fontWeight: '600',
    color: '#007AFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    height: 52.59,
    borderRadius: 39.69,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: -2.98,
      height: 3.97,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 5,
  },
  micButton: {
    marginLeft: 12,
    width: 47.63358688354492,
    height: 47.63358688354492,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
