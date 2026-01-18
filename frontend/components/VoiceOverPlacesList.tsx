import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { LocationItem } from './LocationItem';
import { PlaceDetailsScreen } from './PlaceDetailsScreen';
import { ThemedText } from '@/components/themed-text';
import SettingsIcon from '@/assets/icons/settings_white.svg';
import CameraIcon from '@/assets/icons/camera_white.svg';
import MicIcon from '@/assets/icons/mic.svg';

interface Location {
  id: string;
  name: string;
  distance: string;
  category: string;
  disabilityCategory: {
    [key: string]: number;
  };
}

interface VoiceOverPlacesListProps {
  nearbyPlaces: Location[];
  preferredDisabilityCategories: string[];
  onSettingsPress?: () => void;
  onCameraPress?: () => void;
  onMicPress?: () => void;
}

export const VoiceOverPlacesList: React.FC<VoiceOverPlacesListProps> = ({
  nearbyPlaces,
  preferredDisabilityCategories,
  onSettingsPress,
  onCameraPress,
  onMicPress
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Location | null>(null);

  const handlePlaceSelect = (place: Location) => {
    setSelectedPlace(place);
  };

  const handleBackToList = () => {
    setSelectedPlace(null);
  };

  if (selectedPlace) {
    return (
      <PlaceDetailsScreen 
        place={selectedPlace}
        preferredDisabilityCategories={preferredDisabilityCategories}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText 
            style={styles.title}
            accessibilityRole="header"
          >
            Nearby Places
          </ThemedText>
        </View>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onCameraPress}
            accessibilityLabel="Camera"
            accessibilityHint="Take a photo to identify objects or text"
          >
            <CameraIcon width={24} height={24} fill="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.micButton}
            onPress={onMicPress}
            accessibilityLabel="Voice input"
            accessibilityHint="Use voice commands or dictation"
          >
            <MicIcon width={60} height={60} fill="#1A2126" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onSettingsPress}
            accessibilityLabel="Settings"
            accessibilityHint="Configure accessibility preferences"
          >
            <SettingsIcon width={28} height={28} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={nearbyPlaces}
        renderItem={({ item, index }) => (
          <View 
            style={styles.itemContainer}
            accessibilityLabel={`Place ${index + 1} of ${nearbyPlaces.length}`}
          >
            <LocationItem 
              item={item} 
              preferredDisabilityCategories={preferredDisabilityCategories}
              onPress={() => handlePlaceSelect(item)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        accessibilityLabel="List of nearby places"
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    paddingHorizontal: 4,
    marginBottom: 25,
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: '#1A2126',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#0D1514',
    letterSpacing: -0.5,
    fontFamily: 'Inter',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
});
