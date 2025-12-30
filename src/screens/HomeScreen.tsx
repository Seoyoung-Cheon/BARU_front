import React from 'react';
import { View, Image, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn } = useAuth();

  const handlePress = () => {
    navigation.navigate('Step1');
  };

  const handleMyPagePress = () => {
    if (isLoggedIn) {
      navigation.navigate('MyPage');
    } else {
      navigation.navigate('Login', {});
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.myIconButton}
          onPress={handleMyPagePress}
          activeOpacity={0.8}
        >
          <Text style={styles.myIconText}>{isLoggedIn ? 'My' : '로그인'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handlePress}
        >
          <Text style={styles.buttonText}>BARU 가기</Text>
        </TouchableOpacity>
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
  logo: {
    width: 500,
    height: 200,
  },
  myIconButton: {
    position: 'absolute',
    right: 20,
    top: 85,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  myIconText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#333333',
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#D7E3A1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Juache',
  },
});
