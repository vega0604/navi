import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { LocationItem } from './LocationItem';
import { ThemedText } from '@/components/themed-text';
import SettingsIcon from '@/assets/icons/settings_black.svg';
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
          <ThemedText 
            style={styles.subtitle}
            accessibilityHint="List of places near your current location, ordered by distance"
          >
            {nearbyPlaces.length} places found near you
          </ThemedText>
        </View>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onCameraPress}
            accessibilityLabel="Camera"
            accessibilityHint="Take a photo to identify objects or text"
          >
            <CameraIcon width={20} height={20} fill="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Camera</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onMicPress}
            accessibilityLabel="Voice input"
            accessibilityHint="Use voice commands or dictation"
          >
            <MicIcon width={20} height={20} fill="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Voice</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onSettingsPress}
            accessibilityLabel="Settings"
            accessibilityHint="Configure accessibility preferences"
          >
            <SettingsIcon width={20} height={20} fill="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Settings</ThemedText>
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
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D1514',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
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
