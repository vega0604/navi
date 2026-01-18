import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LocationIcon from '@/assets/icons/location.svg';
import WheelchairIcon from '@/assets/icons/wheelchair_black.svg';
import LightIcon from '@/assets/icons/light_black.svg';
import SoundIcon from '@/assets/icons/sound_black.svg';
import BatteryIcon from '@/assets/icons/battery_black.svg';
import VisualIcon from '@/assets/icons/visual_black.svg';
import LungsIcon from '@/assets/icons/lungs_black.svg';

// Accessibility icon mapping
const accessibilityIcons = {
  'Mobility Impairment': WheelchairIcon,
  'Visual Impairment': VisualIcon,
  'Light Sensitivity': LightIcon,
  'Sound Sensitivity': SoundIcon,
  'Chronic Fatigue': BatteryIcon,
  'Respiratory Issues': LungsIcon,
};

interface LocationItemProps {
  item: {
    id: string;
    name: string;
    distance: string;
    category: string;
    disabilityCategory: {
      [key: string]: number;
    };
  };
  preferredDisabilityCategories: string[];
}

export const LocationItem: React.FC<LocationItemProps> = ({ item, preferredDisabilityCategories }) => {
  // Filter accessibility features based on user preferences and rating 4.0 or higher
  const accessibleFeatures = Object.entries(item.disabilityCategory)
    .filter(([feature, rating]) => {
      // Only show if rating is 4.0 or higher AND user has selected this category
      return rating >= 4.0 && (
        preferredDisabilityCategories.length === 0 || // Show all if no preferences set
        preferredDisabilityCategories.includes(feature)
      );
    })
    .map(([feature, _]) => feature);

  return (
    <TouchableOpacity 
      style={styles.locationItem}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <ThemedView style={styles.locationContent}>
        <View style={styles.locationHeader}>
          <LocationIcon width={29.77} height={29.77} fill="#666" />
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
                  <IconComponent width={28} height={28} fill="#000000" />
                </View>
              );
            })}
          </View>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  locationItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1514',
  },
  locationDistance: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  accessibilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  accessibilityTag: {
    width: 45,
    height: 45,
    backgroundColor: '#F3FFFD',
    borderRadius: 21,
    marginRight: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
