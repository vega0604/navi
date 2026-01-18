import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchPlaceDetails, getPhotoUrl, PlaceDetails } from '@/services/placesApi';
import WheelchairIcon from '@/assets/icons/wheelchair_black.svg';
import VisualIcon from '@/assets/icons/visual_black.svg';
import LightIcon from '@/assets/icons/light_black.svg';
import SoundIcon from '@/assets/icons/sound_black.svg';
import BatteryIcon from '@/assets/icons/battery_black.svg';
import LungsIcon from '@/assets/icons/lungs_black.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Accessibility icon mapping
const accessibilityIcons = {
  'Mobility Impairment': WheelchairIcon,
  'Visual Impairment': VisualIcon,
  'Light Sensitivity': LightIcon,
  'Sound Sensitivity': SoundIcon,
  'Chronic Fatigue': BatteryIcon,
  'Respiratory Issues': LungsIcon,
};

// Helper function to render star rating
const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('☆');
    } else {
      stars.push('☆');
    }
  }
  
  return stars.join('');
};

interface PlaceDetailsScreenProps {
  place: {
    id: string;
    name: string;
    distance: string;
    category: string;
    placeId?: string;
    disabilityCategory: {
      [key: string]: number;
    };
  };
  preferredDisabilityCategories: string[];
  onBack: () => void;
}

export const PlaceDetailsScreen: React.FC<PlaceDetailsScreenProps> = ({
  place,
  preferredDisabilityCategories,
  onBack
}) => {
  const insets = useSafeAreaInsets();
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPlaceDetails = async () => {
      if (place.placeId) {
        setLoading(true);
        console.log('🔍 Loading place details for:', place.name);
        const details = await fetchPlaceDetails(place.placeId);
        if (details) {
          setPlaceDetails(details);
          console.log('✅ Place details loaded:', details.name);
          console.log('📸 Photos available:', details.photos?.length || 0);
        }
        setLoading(false);
      }
    };

    loadPlaceDetails();
  }, [place.placeId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', '#8AC2B5']}
        locations={[0, 0.6, 1]}
        style={styles.gradientBackground}
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel="Go back to places list"
        >
          <ThemedText style={styles.backArrow}>←</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.placeInfo}>
          <ThemedText style={styles.placeName}>{place.name}</ThemedText>
          <View style={styles.overallRatingContainer}>
            <ThemedText style={styles.overallRating}>
              ★ 0 ratings
            </ThemedText>
          </View>
        </View>

        {/* Photos Section */}
        {placeDetails?.photos && placeDetails.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Image
              source={{ uri: getPhotoUrl(placeDetails.photos[0].photoReference, 400) }}
              style={styles.placePhoto}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.overviewSection}>
          <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
          <View style={styles.cardsContainer}>
            {Object.entries(place.disabilityCategory)
              .filter(([feature, rating]) => {
                // Only show categories that are selected by user
                // If no preferences set, show all categories
                return preferredDisabilityCategories.length === 0 || 
                       preferredDisabilityCategories.includes(feature);
              })
              .map(([feature, rating]) => {
                const IconComponent = accessibilityIcons[feature as keyof typeof accessibilityIcons];
                return (
                  <View key={feature} style={styles.accessibilityCard}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <ThemedText style={styles.categoryName}>{feature}</ThemedText>
                        <ThemedText style={styles.starRating}>{renderStars(rating)}</ThemedText>
                      </View>
                      <View style={styles.cardRight}>
                        {IconComponent && <IconComponent width={28} height={28} fill="#000000" />}
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>


        {loading && (
          <View style={styles.detailsSection}>
            <ThemedText style={styles.loadingText}>Loading place details...</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0D1514',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  placeInfo: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'normal',
    color: '#0D1514',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  overallRatingContainer: {
    marginBottom: 12,
  },
  overallRating: {
    fontSize: 15,
    color: '#8E8E8E',
    fontFamily: 'Inter',
  },
  overviewSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1514',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  cardsContainer: {
    gap: 12,
  },
  accessibilityCard: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: 'normal',
    color: '#0D1514',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  starRating: {
    fontSize: 22,
    color: '#000000',
    letterSpacing: 2,
    fontFamily: 'Inter',
  },
  detailsSection: {
    paddingHorizontal: 0,
    marginTop: 16,
    marginBottom: 20,
  },
  detailsText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  photosSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  placePhoto: {
    width: 250,
    height: 180,
    borderRadius: 12,
  },
  address: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    lineHeight: 20,
  },
  openStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  openNow: {
    color: '#34C759',
  },
  closedNow: {
    color: '#FF3B30',
  },
  hoursText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
