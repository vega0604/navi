import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
import CheckmarkCircleIcon from '@/assets/icons/checkmark_circle.svg';
import LogoIcon from '@/assets/icons/logo.svg';

// Accessibility icon mappings
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

const allCategories = [
  'Mobility Impairment',
  'Visual Impairment', 
  'Light Sensitivity',
  'Sound Sensitivity',
  'Chronic Fatigue',
  'Respiratory Issues'
];

interface SettingsModalProps {
  showSettingsModal: boolean;
  preferredDisabilityCategories: string[];
  isFirstTime: boolean;
  toggleDisabilityPreference: (category: string) => void;
  closeSettingsModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettingsModal,
  preferredDisabilityCategories,
  isFirstTime,
  toggleDisabilityPreference,
  closeSettingsModal
}) => {
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
        
        <View style={styles.modalContent}>
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
        </View>
        
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalTopSection: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  categoryCard: {
    width: '48%',
    height: 120,
    backgroundColor: '#1A2126',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
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
  modalBottomButton: {
    height: 67,
    width: 230,
    backgroundColor: '#015F70',
    alignSelf: 'center',
    marginTop: 60,
    marginBottom: 60,
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
