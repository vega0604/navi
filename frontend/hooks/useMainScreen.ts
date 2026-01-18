import { useState, useEffect, useRef } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPlaceDetails, PlaceDetails, fetchNearbyPlaces, NearbyPlace } from '@/services/placesApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 100;

export const useMainScreen = () => {
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
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Storage keys for AsyncStorage
  const STORAGE_KEY = '@navi_preferred_disability_categories';
  const FIRST_TIME_KEY = '@navi_first_time_user';

  // Refs
  const mapRef = useRef<MapView>(null);
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const poiClickLock = useRef(false);
  const scrollY = useRef(0);
  const isAnimating = useRef(false);

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

  // Pan responder for bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Don't allow dragging while opening animation runs
        if (isAnimating.current) return false;
        
        // If content can scroll, don't move sheet
        if (scrollY.current > 0) return false;

        // Allow upward gestures (expand sheet) or strong downward gestures (collapse)
        const isUpwardGesture = gestureState.dy < -10;
        const isStrongDownwardGesture = gestureState.dy > 15;
        
        return isUpwardGesture || isStrongDownwardGesture;
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
          isAnimating.current = true;
          setIsSheetExpanded(true);
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MAX_HEIGHT,
            useNativeDriver: false,
          }).start(() => {
            isAnimating.current = false;
          });
        } else {
          // Collapse
          isAnimating.current = true;
          setIsSheetExpanded(false);
          Animated.spring(bottomSheetHeight, {
            toValue: BOTTOM_SHEET_MIN_HEIGHT,
            useNativeDriver: false,
          }).start(() => {
            isAnimating.current = false;
          });
        }
      },
    })
  ).current;

  // Get location permission and current location
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

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Fetch nearby places when location is available
  useEffect(() => {
    const fetchNearby = async () => {
      if (location) {
        console.log('📍 Location available, fetching nearby places...');
        const places = await fetchNearbyPlaces(
          location.coords.latitude,
          location.coords.longitude,
          2000 // 2km radius
        );
        setNearbyPlaces(places);
        console.log(`✅ Found ${places.length} nearby places`);
      }
    };

    fetchNearby();
  }, [location]);


  const handlePoiClick = async (event: any) => {
    if (poiClickLock.current) return;
    poiClickLock.current = true;

    const { coordinate, placeId, name } = event.nativeEvent;
    console.log('POI clicked:', {
      name: name,
      placeId: placeId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });

    requestAnimationFrame(() => {
      setClickedPoi({
        coordinate,
        name,
        placeId,
      });
    });

    // Fetch detailed place information
    if (placeId) {
      console.log('🔍 Fetching details for place:', name);
      const details = await fetchPlaceDetails(placeId);
      if (details) {
        setPlaceDetails(details);
        console.log('✅ Place details fetched:', details.name);
      } else {
        console.log('❌ Failed to fetch place details');
        setPlaceDetails(null);
      }
    }

    setTimeout(() => {
      poiClickLock.current = false;
    }, 500);
  };

  // Function to expand the sheet programmatically
  const expandSheet = () => {
    if (!isSheetExpanded && !isAnimating.current) {
      isAnimating.current = true;
      setIsSheetExpanded(true);
      Animated.spring(bottomSheetHeight, {
        toValue: BOTTOM_SHEET_MAX_HEIGHT,
        useNativeDriver: false,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  };

  return {
    // State
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
    
    // Refs
    mapRef,
    bottomSheetHeight,
    scrollY,
    
    // Functions
    setSearchText,
    setErrorMsg,
    toggleDisabilityPreference,
    closeSettingsModal,
    handlePoiClick,
    expandSheet,
    setShowSettingsModal,
    
    // Pan handlers
    panHandlers: panResponder.panHandlers,
  };
};
 