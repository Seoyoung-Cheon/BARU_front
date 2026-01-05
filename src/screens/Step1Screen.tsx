import React, { useRef, useState, useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity, Animated, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { getBoldStyle } from '../utils/fontStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Step1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [imageLoaded, setImageLoaded] = useState({ domestic: false, abroad: false });

  const handleGoBack = () => {
    navigation.goBack();
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

  const handleSelect = (isDomestic: boolean) => {
    navigation.navigate('Step2', { isDomestic });
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

      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>여행 지역을 선택해주세요</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleSelect(true)}
            activeOpacity={0.8}
          >
            {!imageLoaded.domestic && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#D7E3A1" />
              </View>
            )}
            <Image
              source={require('../../assets/guknae.jpg')}
              style={styles.optionButtonImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoaded(prev => ({ ...prev, domestic: false }))}
              onLoad={() => setImageLoaded(prev => ({ ...prev, domestic: true }))}
              onError={() => setImageLoaded(prev => ({ ...prev, domestic: true }))}
              fadeDuration={200}
            />
            <View style={styles.optionButtonOverlay}>
              <Text style={styles.optionButtonText}>국내</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handleSelect(false)}
            activeOpacity={0.8}
          >
            {!imageLoaded.abroad && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#D7E3A1" />
              </View>
            )}
            <Image
              source={require('../../assets/abroad (3).jpg')}
              style={styles.optionButtonImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoaded(prev => ({ ...prev, abroad: false }))}
              onLoad={() => setImageLoaded(prev => ({ ...prev, abroad: true }))}
              onError={() => setImageLoaded(prev => ({ ...prev, abroad: true }))}
              fadeDuration={200}
            />
            <View style={styles.optionButtonOverlay}>
              <Text style={styles.optionButtonText}>해외</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  titleText: {
    fontSize: 24,
    fontFamily: 'Juache',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
    top: 30,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: 50,
    
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 180,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  optionButtonImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageLoadingContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionButtonOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Juache',
    ...getBoldStyle('Juache'),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

