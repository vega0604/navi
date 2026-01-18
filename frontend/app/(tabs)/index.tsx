import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Mock data for nearby locations
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

export default function ListScreen() {
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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Nearby Locations</ThemedText>
        <ThemedText style={styles.subtitle}>
          Voice-accessible list of locations around you
        </ThemedText>
      </ThemedView>
      
      <FlatList
        data={mockLocations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  locationItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationContent: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
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
});
