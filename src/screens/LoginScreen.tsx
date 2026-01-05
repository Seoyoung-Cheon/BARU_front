import React, { useRef } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { getFontWeight } from '../utils/fontStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type LoginScreenRouteProp = {
  key: string;
  name: 'Login';
  params: {
    redirectTo?: 'Detail';
    detailParams?: {
      flight: any;
      hotels: any[];
      exchange?: any;
      budget?: string;
      peopleCount?: string;
      departureDate?: Date;
      arrivalDate?: Date;
    };
  };
};

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const { login } = useAuth();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

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

  const handleSocialLogin = (provider: 'kakao' | 'google') => {
    // TODO: 카카오톡/구글 로그인 API 연동
    console.log(`${provider} 로그인 시도`);
    
    // 임시로 로그인 성공 처리
    login(); // 로그인 상태 저장
    
    // Detail로 리다이렉트해야 하는 경우
    if (route.params?.redirectTo === 'Detail' && route.params?.detailParams) {
      // Login 화면을 스택에서 제거하고 Detail로 이동
      // 이렇게 하면 Detail에서 뒤로가기를 누를 때 Result 화면으로 돌아감
      navigation.replace('Detail', route.params.detailParams);
    } else {
      navigation.navigate('Home');
    }
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
      <View style={styles.content}>
        <Text style={styles.title}>로그인</Text>
        
        <View style={styles.socialLoginContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('kakao')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/kakaotalk (2).png')}
              style={styles.socialButtonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/Google (2).png')}
              style={styles.socialButtonImage}
              resizeMode="contain"
            />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Juache',
    color: '#000000',
    ...getFontWeight('600'),
    marginBottom: 40,
    textAlign: 'center',
    top: 50,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
    marginTop: 50,
  },
  socialButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonImage: {
    width: 50,
    height: 50,
  },
});

