import React, { useRef, useState } from 'react';
import { View, Image, ImageBackground, StyleSheet, StatusBar, TouchableOpacity, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const styleOptions = [
  { id: 1, name: '휴양지', image: require('../../assets/hue.jpg') },
  { id: 2, name: '바다', image: require('../../assets/sea.jpg') },
  { id: 3, name: '자연', image: require('../../assets/zayeon.jpg') },
  { id: 4, name: '문화재', image: require('../../assets/mun.jpg') },
];

export default function Step1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (selectedStyleId) {
      navigation.navigate('Step2');
    }
  };

  const handleStyleSelect = (styleId: number) => {
    setSelectedStyleId(styleId);
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.logoContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.backButtonInner,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Image
              source={require('../../assets/arrow.png')}
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>어떤 여행 스타일을 좋아하시나요?</Text>
      </View>
      <View style={styles.gridContainer}>
        {styleOptions.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <TouchableOpacity
              key={style.id}
              style={[styles.styleCard, isSelected && styles.styleCardSelected]}
              activeOpacity={0.9}
              onPress={() => handleStyleSelect(style.id)}
            >
              <ImageBackground
                source={style.image}
                style={styles.styleCardImage}
                imageStyle={styles.styleImageInner}
                resizeMode="cover"
              >
                <View style={styles.styleTextOverlay}>
                  <Text style={styles.styleText}>{style.name}</Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  </View>
                )}
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedStyleId && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>다음으로</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 85,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonIcon: {
    width: 18,
    height: 18,
    tintColor: '#333333',
  },
  logo: {
    width: 500,
    height: 200,
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: -30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 25,
    fontFamily: 'Juache',
    color: '#000000',
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  styleCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  styleCardSelected: {
    borderWidth: 4,
    borderColor: '#D7E3A1',
  },
  styleCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleImageInner: {
    borderRadius: 12,
  },
  styleTextOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Juache',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D7E3A1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  selectedCheckmark: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  nextButton: {
    backgroundColor: '#D7E3A1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4.65,
    elevation: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Juache',
    fontWeight: 'bold',
  },
});
