import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import IntroScreen from './src/screens/IntroScreen';
import HomeScreen from './src/screens/HomeScreen';
import Step1Screen from './src/screens/Step1Screen';
import Step2Screen from './src/screens/Step2Screen';
import ResultScreen from './src/screens/ResultScreen';
import DetailScreen from './src/screens/DetailScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import LoginScreen from './src/screens/LoginScreen';
import type { RootStackParamList } from './src/types/navigation';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Juache': require('./assets/BMJUA_ttf.ttf'),
    'Hakgyoansim': require('./assets/assets/fonts/Hakgyoansim_BoardmarkerR.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Intro"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Step1" component={Step1Screen} />
          <Stack.Screen name="Step2" component={Step2Screen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Detail" component={DetailScreen} />
          <Stack.Screen name="MyPage" component={MyPageScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
