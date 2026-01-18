import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Animated, StyleSheet, ScrollView } from 'react-native';
import { LocationItem } from './LocationItem';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

interface BottomSheetProps {
  bottomSheetHeight: Animated.Value;
  searchText: string;
  setSearchText: (text: string) => void;
  mockLocations: Location[];
  preferredDisabilityCategories: string[];
  isSheetExpanded: boolean;
  expandSheet: () => void;
  scrollY: React.MutableRefObject<number>;
  panHandlers: any;
  onPlaceSelect?: (place: Location) => void;
  isSearching?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  bottomSheetHeight,
  searchText,
  setSearchText,
  mockLocations,
  preferredDisabilityCategories,
  isSheetExpanded,
  expandSheet,
  scrollY,
  panHandlers,
  onPlaceSelect,
  isSearching = false
}) => {

  return (
    <Animated.View 
      style={[
        styles.bottomSheet,
        {
          height: bottomSheetHeight,
        }
      ]}
      {...panHandlers}
    >
      <View style={styles.bottomSheetHandle} />
      
      <View style={styles.bottomSheetContent}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            placeholderTextColor="rgba(0, 0, 0, 0.65)"
            value={searchText}
            onChangeText={setSearchText}
            editable={isSheetExpanded}
            onPressIn={() => {
              if (!isSheetExpanded) {
                expandSheet();
              }
            }}
          />
          <TouchableOpacity style={styles.micButton}>
            <MicIcon />
          </TouchableOpacity>
        </View>
        <FlatList
          data={mockLocations}
          renderItem={({ item }) => (
            <LocationItem 
              item={item} 
              preferredDisabilityCategories={preferredDisabilityCategories}
              onPress={() => onPlaceSelect?.(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          style={styles.locationsList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          bounces={false}
          alwaysBounceVertical={false}
          onScroll={(e) => {
            scrollY.current = Math.max(0, e.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  micButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    width: 42,
    height: 42,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  locationsList: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
});
