import { Platform, TextStyle } from 'react-native';

/**
 * Android에서는 fontWeight를 지원하지 않으므로,
 * iOS에서만 fontWeight를 적용하고 Android에서는 제거합니다.
 * 
 * 만약 Bold 폰트 파일이 있다면 (예: Juache-Bold.ttf),
 * Android에서는 fontFamily를 'Juache-Bold'로 설정해야 합니다.
 */
export const getFontWeight = (weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' = 'normal'): Partial<TextStyle> => {
  if (Platform.OS === 'android') {
    // Android에서는 fontWeight를 제거
    // 만약 Bold 폰트가 필요하다면, fontFamily를 별도로 설정해야 함
    // 예: fontFamily: weight === 'bold' ? 'Juache-Bold' : 'Juache'
    return {};
  }
  
  // iOS에서는 fontWeight 사용
  return { fontWeight: weight };
};

/**
 * Android에서 Bold 텍스트를 위한 스타일
 * Bold 폰트 파일이 있다면 fontFamily를 변경해야 함
 */
export const getBoldStyle = (baseFontFamily: string = 'Juache'): Partial<TextStyle> => {
  if (Platform.OS === 'android') {
    // Bold 폰트 파일이 있다면 (예: Juache-Bold.ttf)
    // return { fontFamily: `${baseFontFamily}-Bold` };
    
    // 현재는 Bold 폰트 파일이 없으므로 fontWeight 제거
    return {};
  }
  
  return { fontWeight: 'bold' };
};

