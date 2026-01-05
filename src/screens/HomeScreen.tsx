import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, StatusBar, TouchableOpacity, Text, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { VideoView, useVideoPlayer } from 'expo-video';
import Svg, { Path } from 'react-native-svg';
import { getBoldStyle, getFontWeight } from '../utils/fontStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  const player = useVideoPlayer(require('../../assets/main-vd.mp4'), (player) => {
    player.loop = false; // 수동 루프 제어로 더 부드러운 전환
    player.muted = true;
    player.playbackRate = 0.5;
    player.play();
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isRestarting = false;
    let lastProgress = 0;

    const checkAndLoop = () => {
      try {
        if (isRestarting || !player.duration || player.duration === 0) {
          return;
        }

        const currentTime = player.currentTime;
        const duration = player.duration;
        const progress = currentTime / duration;

        // 진행률이 갑자기 줄어들면 (비디오가 다시 시작됨) 무시
        if (progress < lastProgress - 0.05) {
          lastProgress = progress;
          return;
        }

        lastProgress = progress;

        // 비디오가 거의 끝나기 전 (97% 지점)에 미리 seek 시작하여 부드러운 전환
        // 더 일찍 시작하여 seek 시간을 확보
        if (progress >= 0.97 && !isRestarting) {
          isRestarting = true;
          // 즉시 처음으로 이동하고 재생
          player.currentTime = 0;
          player.play();
          
          // 플래그 리셋 (seek 완료 대기 시간 최소화)
          setTimeout(() => {
            isRestarting = false;
            lastProgress = 0;
          }, 50);
        }
      } catch (error) {
        isRestarting = false;
      }
    };

    // 비디오가 준비되면 체크 시작 (매우 짧은 간격으로 체크)
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay' && !intervalId) {
        // 10ms마다 체크하여 더 부드러운 전환
        intervalId = setInterval(checkAndLoop, 10);
      }
    });

    // playToEnd 이벤트도 처리 (백업 - 비디오가 실제로 끝났을 때)
    const playToEndSubscription = player.addListener('playToEnd', () => {
      if (!isRestarting) {
        isRestarting = true;
        player.currentTime = 0;
        player.play();
        setTimeout(() => {
          isRestarting = false;
          lastProgress = 0;
        }, 50);
      }
    });

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      subscription.remove();
      playToEndSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    // 텍스트 부드럽게 나타나는 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      <View style={styles.videoContainer} pointerEvents="none">
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
      <View style={styles.logoContainer} pointerEvents="box-none">
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.myIconButton}
          onPress={handleMyPagePress}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.myIconText}>{isLoggedIn ? 'My' : '로그인'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.centerTextContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
          pointerEvents="none"
        >
          <Animated.Text 
            style={styles.centerText}
          >
            예산에 맞춰 떠나는 여행, BARU
          </Animated.Text>
        </Animated.View>
      </View>
      <View style={styles.buttonContainer} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.button}
          onPress={handlePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>BARU 가기</Text>
            <Svg
              width={50}
              height={20}
              viewBox="0 0 38 15"
              fill="none"
            >
              <Path
                fill="white"
                d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364zM1 7.519l.554.833.029-.019.094-.061.361-.23 1.277-.77c1.054-.609 2.397-1.32 3.629-1.787.617-.234 1.17-.392 1.623-.455.477-.066.707-.008.788.034.025.013.031.021.039.034a.56.56 0 0 1 .058.235c.029.327-.047.906-.39 1.842l1.878.689c.383-1.044.571-1.949.505-2.705-.072-.815-.45-1.493-1.16-1.865-.627-.329-1.358-.332-1.993-.244-.659.092-1.367.305-2.056.566-1.381.523-2.833 1.297-3.921 1.925l-1.341.808-.385.245-.104.068-.028.018c-.011.007-.011.007.543.84zm8.061-.344c-.198.54-.328 1.038-.36 1.484-.032.441.024.94.325 1.364.319.45.786.64 1.21.697.403.054.824-.001 1.21-.09.775-.179 1.694-.566 2.633-1.014l3.023-1.554c2.115-1.122 4.107-2.168 5.476-2.524.329-.086.573-.117.742-.115s.195.038.161.014c-.15-.105.085-.139-.076.685l1.963.384c.192-.98.152-2.083-.74-2.707-.405-.283-.868-.37-1.28-.376s-.849.069-1.274.179c-1.65.43-3.888 1.621-5.909 2.693l-2.948 1.517c-.92.439-1.673.743-2.221.87-.276.064-.429.065-.492.057-.043-.006.066.003.155.127.07.099.024.131.038-.063.014-.187.078-.49.243-.94l-1.878-.689zm14.343-1.053c-.361 1.844-.474 3.185-.413 4.161.059.95.294 1.72.811 2.215.567.544 1.242.546 1.664.459a2.34 2.34 0 0 0 .502-.167l.15-.076.049-.028.018-.011c.013-.008.013-.008-.524-.852l-.536-.844.019-.012c-.038.018-.064.027-.084.032-.037.008.053-.013.125.056.021.02-.151-.135-.198-.895-.046-.734.034-1.887.38-3.652l-1.963-.384zm2.257 5.701l.791.611.024-.031.08-.101.311-.377 1.093-1.213c.922-.954 2.005-1.894 2.904-2.27l-.771-1.846c-1.31.547-2.637 1.758-3.572 2.725l-1.184 1.314-.341.414-.093.117-.025.032c-.01.013-.01.013.781.624zm5.204-3.381c.989-.413 1.791-.42 2.697-.307.871.108 2.083.385 3.437.385v-2c-1.197 0-2.041-.226-3.19-.369-1.114-.139-2.297-.146-3.715.447l.771 1.846z"
              />
            </Svg>
          </View>
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
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    position: 'relative',
    zIndex: 10,
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
    zIndex: 11,
  },
  myIconText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#333333',
    ...getBoldStyle('Juache'),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    zIndex: 10,
  },
  button: {
    backgroundColor: '#D7E3A1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D7E3A1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Juache',
    ...getFontWeight('600'),
    letterSpacing: 0.5,
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 350,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
 
  centerText: {
    fontSize: 22,
    fontFamily: 'Hakgyoansim',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
    color: '#ffffff',
    textAlign: 'center',
    ...getBoldStyle('Hakgyoansim'),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
