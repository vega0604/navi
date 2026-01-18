import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Animated, PanResponder, Dimensions, FlatList, TextInput, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import MicIcon from '@/assets/icons/mic.svg';
import LocationIcon from '@/assets/icons/location.svg';
import WheelchairIcon from '@/assets/icons/wheelchair_black.svg';
import LightIcon from '@/assets/icons/light_black.svg';
import SoundIcon from '@/assets/icons/sound_black.svg';
import BatteryIcon from '@/assets/icons/battery_black.svg';
import VisualIcon from '@/assets/icons/visual_black.svg';
import LungsIcon from '@/assets/icons/lungs_black.svg';
import WheelchairWhiteIcon from '@/assets/icons/wheelchair_white.svg';
import LightWhiteIcon from '@/assets/icons/light_white.svg';
import SoundWhiteIcon from '@/assets/icons/sound_white.svg';
import BatteryWhiteIcon from '@/assets/icons/battery_white.svg';
import VisualWhiteIcon from '@/assets/icons/visual_white.svg';
import LungsWhiteIcon from '@/assets/icons/lungs_white.svg';
import SettingsIcon from '@/assets/icons/settings_black.svg';
import EmergencyIcon from '@/assets/icons/emergency.svg';
import CheckmarkCircleIcon from '@/assets/icons/checkmark_circle.svg';
import LogoIcon from '@/assets/icons/logo.svg';

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
  const [preferredDisabilityCategories, setPreferredDisabilityCategories] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Storage keys for AsyncStorage
  const STORAGE_KEY = '@navi_preferred_disability_categories';
  const FIRST_TIME_KEY = '@navi_first_time_user';

  // Load preferred disability categories from storage
  const loadPreferences = async () => {
    try {
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEY);
      const firstTimeFlag = await AsyncStorage.getItem(FIRST_TIME_KEY);
      
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        setPreferredDisabilityCategories(preferences);
      }
      
      // If no first-time flag exists, this is a first-time user
      if (firstTimeFlag === null) {
        setIsFirstTime(true);
        setShowSettingsModal(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Save preferred disability categories to storage
  const savePreferences = async (categories: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      setPreferredDisabilityCategories(categories);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Toggle a disability category preference
  const toggleDisabilityPreference = async (category: string) => {
    const updatedCategories = preferredDisabilityCategories.includes(category)
      ? preferredDisabilityCategories.filter(cat => cat !== category)
      : [...preferredDisabilityCategories, category];
    
    await savePreferences(updatedCategories);
  };

  // Mark user as no longer first-time
  const markUserAsReturning = async () => {
    try {
      await AsyncStorage.setItem(FIRST_TIME_KEY, 'false');
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error marking user as returning:', error);
    }
  };

  // Close settings modal (with first-time handling)
  const closeSettingsModal = async () => {
    if (isFirstTime) {
      await markUserAsReturning();
    }
    setShowSettingsModal(false);
  };

  // Accessibility icon mapping
  const accessibilityIcons = {
    'Mobility Impairment': WheelchairIcon,
    'Visual Impairment': VisualIcon,
    'Light Sensitivity': LightIcon,
    'Sound Sensitivity': SoundIcon,
    'Chronic Fatigue': BatteryIcon,
    'Respiratory Issues': LungsIcon,
  };

  const accessibilityWhiteIcons = {
    'Mobility Impairment': WheelchairWhiteIcon,
    'Visual Impairment': VisualWhiteIcon,
    'Light Sensitivity': LightWhiteIcon,
    'Sound Sensitivity': SoundWhiteIcon,
    'Chronic Fatigue': BatteryWhiteIcon,
    'Respiratory Issues': LungsWhiteIcon,
  };
  
  const mapRef = useRef<MapView>(null);
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;

  const mockLocations = [
    {
      id: '1',
      name: 'JC Saddington Park',
      distance: '0.2 miles',
      category: 'Park',
      disabilityCategory: {
        'Mobility Impairment': 4.5,
        'Visual Impairment': 4.2,
        'Light Sensitivity': 3.8,
        'Sound Sensitivity': 4.7,
        'Chronic Fatigue': 4.1,
        'Respiratory Issues': 4.8,
      },
    },
    {
      id: '2',
      name: 'Cooksville Cook',
      distance: '0.4 miles',
      category: 'Restaurant',
      disabilityCategory: {
        'Mobility Impairment': 4.3,
        'Visual Impairment': 3.9,
        'Light Sensitivity': 4.1,
        'Sound Sensitivity': 3.5,
        'Chronic Fatigue': 4.0,
        'Respiratory Issues': 4.2,
      },
    },
    {
      id: '3',
      name: 'Sheridan College HMC',
      distance: '0.6 miles',
      category: 'Education',
      disabilityCategory: {
        'Mobility Impairment': 4.8,
        'Visual Impairment': 4.6,
        'Light Sensitivity': 4.4,
        'Sound Sensitivity': 4.2,
        'Chronic Fatigue': 4.3,
        'Respiratory Issues': 4.1,
      },
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

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

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
        
        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <EmergencyIcon width={39} height={39} fill="#000000" />
        </TouchableOpacity>
        
        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <SettingsIcon width={36.98} height={36.98} fill="#000000" />
        </TouchableOpacity>
      </MapView>
    );
  };

  const renderLocationItem = ({ item }: { item: typeof mockLocations[0] }) => {
    // Filter accessibility features with rating 4.0 or higher
    const accessibleFeatures = Object.entries(item.disabilityCategory)
      .filter(([_, rating]) => rating >= 4.0)
      .map(([feature, _]) => feature);

    return (
      <TouchableOpacity 
        style={styles.locationItem}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <ThemedView style={styles.locationContent}>
          <View style={styles.locationHeader}>
            <LocationIcon width={20} height={20} fill="#666" />
            <ThemedText type="subtitle" style={styles.locationName}>
              {item.name}
            </ThemedText>
          </View>
          {accessibleFeatures.length > 0 && (
            <View style={styles.accessibilityContainer}>
              {accessibleFeatures.map((feature, index) => {
                const IconComponent = accessibilityIcons[feature as keyof typeof accessibilityIcons];
                return (
                  <View key={index} style={styles.accessibilityTag}>
                    <IconComponent width={24} height={24} fill="#000000" />
                  </View>
                );
              })}
            </View>
          )}
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderSettingsModal = () => {
    const allCategories = Object.keys(accessibilityIcons);
    
    return (
      <Modal
        visible={showSettingsModal}
        animationType="fade"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#E3FCF9', '#8AC2B5', '#E3FCF9']}
            locations={[0, 0.5, 1]}
            style={styles.gradientBackground}
          />
          <View style={styles.modalTopSection}>
            <LogoIcon width={70} height={33} />
            <ThemedText style={styles.modalMainText}>
              Select the category that applies to you
            </ThemedText>
          </View>
          
          <ScrollView style={styles.modalContent}>
            
            <View style={styles.categoriesGrid}>
              {allCategories.map((category) => {
                const isSelected = preferredDisabilityCategories.includes(category);
                const IconComponent = isSelected 
                  ? accessibilityIcons[category as keyof typeof accessibilityIcons]
                  : accessibilityWhiteIcons[category as keyof typeof accessibilityWhiteIcons];
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected
                    ]}
                    onPress={() => toggleDisabilityPreference(category)}
                  >
                    <View style={styles.categoryCardContent}>
                      <View style={styles.categoryCardIconContainer}>
                        <IconComponent width={55} height={55} />
                      </View>
                      <ThemedText style={[styles.categoryCardText, { color: isSelected ? "#1A2126" : "#FFFFFF" }]}>
                        {category}
                      </ThemedText>
                      {isSelected && (
                        <View style={styles.categoryCardCheckmark}>
                          <CheckmarkCircleIcon width={44} height={44} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.modalBottomButton}
            onPress={closeSettingsModal}
          >
            <ThemedText style={styles.modalBottomButtonText}>
              {isFirstTime ? 'Get Started' : 'Done'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const renderBottomSheetContent = () => {
    return (
      <View style={styles.bottomSheetContent}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            placeholderTextColor="rgba(0, 0, 0, 0.65)"
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
      
      {renderSettingsModal()}
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
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  locationItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    marginLeft: 8,
    flex: 1,
    color: '#0D1514',
  },
  locationDetails: {
    marginBottom: 8,
    opacity: 0.7,
  },
  accessibilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  accessibilityTag: {
    backgroundColor: '#F3FFFD',
    padding: 7,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: 42,
    height: 42,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    // Android shadow
    elevation: 3,
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
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Settings Modal Styles
  modalContainer: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1514',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 168 / 143.2,
    borderRadius: 12,
    backgroundColor: '#1A2126',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 0,
  },
  categoryCardSelected: {
    backgroundColor: '#F3FFFD',
    borderColor: '#015F70',
  },
  categoryCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoryCardIconContainer: {
    marginBottom: 8,
  },
  categoryCardText: {
    fontSize: 15.4,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryCardCheckmark: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTopSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  modalMainText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A2126',
    textAlign: 'left',
    marginTop: 20,
    lineHeight: 42,
  },
  modalBottomButton: {
    height: 67,
    width: 230,
    backgroundColor: '#015F70',
    alignSelf: 'center',
    marginBottom: 40,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBottomButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 32,
    textAlignVertical: 'center',
  },
});
