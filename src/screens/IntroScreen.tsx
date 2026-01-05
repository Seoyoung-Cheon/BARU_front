import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type IntroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

export default function IntroScreen() {
  const navigation = useNavigation<IntroScreenNavigationProp>();
  
  const player = useVideoPlayer(require('../../assets/Intro (2).mp4'), (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      // 비디오가 끝나면 Home 화면으로 이동
      navigation.replace('Home');
    });

    return () => {
      subscription.remove();
    };
  }, [player, navigation]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D7E3A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '150%',
    height: '150%',
  },
});

