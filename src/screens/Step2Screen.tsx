import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity, Animated, TextInput, ScrollView, Modal, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import Svg, { Path } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'Step2';
  params: {
    isDomestic?: boolean;
  };
};

// 국내 공항 목록 (해외 항공권도 출발/귀국은 국내 공항만 사용)
const domesticAirports = [
  { code: 'ICN', name: '인천(ICN)' },
  { code: 'GMP', name: '김포(GMP)' },
  { code: 'CJU', name: '제주(CJU)' },
  { code: 'PUS', name: '부산(PUS)' },
];

// 국내 기차역 목록
const domesticStations = [
  { code: 'SEOUL', name: '서울' },
  { code: 'BUSAN', name: '부산' },
  { code: 'DAEGU', name: '대구' },
  { code: 'GWANGJU', name: '광주' },
  { code: 'DAEJEON', name: '대전' },
  { code: 'INCHEON', name: '인천' },
  { code: 'JEJU', name: '제주' },
];

export default function Step2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateX = useRef(new Animated.Value(-10)).current;
  const [budget, setBudget] = useState('나의 예산');
  const [peopleCount, setPeopleCount] = useState('인원 수');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const isDomestic = route.params?.isDomestic ?? true;
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // 해외: 출발/귀국 공항
  const [departureAirport, setDepartureAirport] = useState('출발 공항');
  const [returnAirport, setReturnAirport] = useState('귀국 공항');
  const [showDepartureAirportModal, setShowDepartureAirportModal] = useState(false);
  const [showReturnAirportModal, setShowReturnAirportModal] = useState(false);
  
  // 국내: 기차/비행기 선택
  const [transportType, setTransportType] = useState<'train' | 'flight' | null>(null);
  const [departureStation, setDepartureStation] = useState('출발역');
  const [returnStation, setReturnStation] = useState('도착역');
  const [showDepartureStationModal, setShowDepartureStationModal] = useState(false);
  const [showReturnStationModal, setShowReturnStationModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTooltipPress = () => {
    if (showTooltip) {
      // 툴팁 숨기기
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipTranslateX, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(iconRotateAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(iconScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowTooltip(false);
      });
    } else {
      // 툴팁 표시
      setShowTooltip(true);
      Animated.parallel([
        Animated.parallel([
          Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(iconScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tooltipOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(tooltipTranslateX, {
              toValue: 30,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(tooltipTranslateX, {
              toValue: 15,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(tooltipTranslateX, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  };

  const peopleOptions = ['1명', '2명', '3명', '4명', '5명', '6명','7명','8명','9명','10명'];
  const budgetOptions = [
    '10-20만원',
    '20-30만원',
    '30-40만원',
    '40-50만원',
    '50-60만원',
    '60-70만원',
    '70-80만원',
    '80-90만원',
    '90-100만원',
    '100만원 이상'
  ];

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

  const handleNext = () => {
    // 필수값 검증
    const missingFields: string[] = [];
    
    if (!budget || budget === '나의 예산') {
      missingFields.push('나의 예산');
    }
    
    if (!peopleCount || peopleCount === '인원 수') {
      missingFields.push('인원 수');
    }
    
    if (!departureDate) {
      missingFields.push('출발일자');
    }
    
    if (!arrivalDate) {
      missingFields.push('도착일자');
    }
    
    // 해외인 경우 출발/귀국 공항 검증
    if (!isDomestic) {
      if (departureAirport === '출발 공항') {
        missingFields.push('출발 공항');
      }
      if (returnAirport === '귀국 공항') {
        missingFields.push('귀국 공항');
      }
    } else {
      // 국내인 경우 기차/비행기 선택 및 출발/도착 검증
      if (!transportType) {
        missingFields.push('교통수단 선택');
      } else {
        if (departureStation === '출발역' || departureStation === '출발 공항') {
          missingFields.push(transportType === 'train' ? '출발역' : '출발 공항');
        }
        if (returnStation === '귀국역' || returnStation === '귀국 공항') {
          missingFields.push(transportType === 'train' ? '도착역' : '귀국 공항');
        }
      }
    }
    
    // 필수값이 하나라도 없으면 모달 표시
    if (missingFields.length > 0) {
      setValidationMessage(`다음 항목을 입력해주세요:\n${missingFields.join(', ')}`);
      setShowValidationModal(true);
      return;
    }
    
    // 모든 필수값이 입력되었으면 결과 화면으로 이동
    const resultParams: RootStackParamList['Result'] = {
      budget: budget,
      peopleCount: peopleCount,
      departureDate: departureDate || undefined,
      arrivalDate: arrivalDate || undefined,
      isDomestic: isDomestic,
      departureAirport: !isDomestic ? departureAirport : (transportType === 'flight' ? departureStation : undefined),
      returnAirport: !isDomestic ? returnAirport : (transportType === 'flight' ? returnStation : undefined),
      departureStation: isDomestic && transportType === 'train' ? departureStation : undefined,
      returnStation: isDomestic && transportType === 'train' ? returnStation : undefined,
      transportType: isDomestic ? (transportType || undefined) : undefined,
    };
    navigation.navigate('Result', resultParams);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const calculateNights = (): string => {
    if (!departureDate || !arrivalDate) return '';
    
    // 날짜만 비교하기 위해 시간을 초기화
    const depDate = new Date(departureDate);
    depDate.setHours(0, 0, 0, 0);
    const arrDate = new Date(arrivalDate);
    arrDate.setHours(0, 0, 0, 0);
    
    if (arrDate <= depDate) return '';
    
    // 날짜 차이 계산 (밀리초 단위)
    const diffTime = arrDate.getTime() - depDate.getTime();
    // 일 단위로 변환 (Math.floor 사용)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 박수는 날짜 차이와 동일 
    const nights = diffDays;
    
    if (nights === 0) return '당일치기';

    return `${nights}박 ${nights + 1}일`;
  };

  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [isSelectingDeparture, setIsSelectingDeparture] = useState(true);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const getToday = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const isDateInPast = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    const today = getToday();
    return date < today;
  };

  const confirmDate = () => {
    const selectedDate = new Date(tempYear, tempMonth - 1, tempDay);
    selectedDate.setHours(0, 0, 0, 0);
    const today = getToday();

    // 과거 날짜 선택 방지
    if (selectedDate < today) {
      return; // 과거 날짜는 선택 불가
    }

    if (isSelectingDeparture) {
      setDepartureDate(selectedDate);
      if (arrivalDate && selectedDate > arrivalDate) {
        setArrivalDate(null);
      }
      setShowDeparturePicker(false);
    } else {
      // 도착일자는 출발일자 이후만 선택 가능
      if (departureDate && selectedDate >= departureDate) {
        setArrivalDate(selectedDate);
      } else if (!departureDate && selectedDate >= today) {
        setArrivalDate(selectedDate);
      }
      setShowArrivalPicker(false);
    }
  };

  const openDeparturePicker = () => {
    const today = new Date();
    if (departureDate) {
      // 출발일자가 있으면 해당 날짜로 초기화
      setTempYear(departureDate.getFullYear());
      setTempMonth(departureDate.getMonth() + 1);
      setTempDay(departureDate.getDate());
    } else {
      // 출발일자가 없으면 오늘 날짜로 초기화
      setTempYear(today.getFullYear());
      setTempMonth(today.getMonth() + 1);
      setTempDay(today.getDate());
    }
    setIsSelectingDeparture(true);
    setShowDeparturePicker(true);
  };

  const openArrivalPicker = () => {
    const today = new Date();
    if (arrivalDate) {
      // 도착일자가 있으면 해당 날짜로 초기화
      setTempYear(arrivalDate.getFullYear());
      setTempMonth(arrivalDate.getMonth() + 1);
      setTempDay(arrivalDate.getDate());
    } else if (departureDate) {
      // 도착일자가 없고 출발일자가 있으면 출발일자 다음 날로 초기화
      const nextDay = new Date(departureDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setTempYear(nextDay.getFullYear());
      setTempMonth(nextDay.getMonth() + 1);
      setTempDay(nextDay.getDate());
    } else {
      // 둘 다 없으면 오늘 날짜로 초기화
      setTempYear(today.getFullYear());
      setTempMonth(today.getMonth() + 1);
      setTempDay(today.getDate());
    }
    setIsSelectingDeparture(false);
    setShowArrivalPicker(true);
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
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionContainer}>
          <View style={styles.labelWithTooltip}>
            <Text style={styles.labelText}>나의 예산</Text>
            <View style={styles.tooltipContainer}>
              <TouchableOpacity
                style={styles.icon}
                onPress={handleTooltipPress}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: iconRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                      { scale: iconScaleAnim },
                    ],
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.518 0-10-4.482-10-10s4.482-10 10-10 10 4.482 10 10-4.482 10-10 10zm-1-16h2v6h-2zm0 8h2v2h-2z"
                      fill="#000000"
                    />
                  </Svg>
                </Animated.View>
              </TouchableOpacity>
              {showTooltip && (
                <Animated.View
                  style={[
                    styles.tooltip,
                    {
                      opacity: tooltipOpacity,
                      transform: [{ translateX: tooltipTranslateX }],
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>
                    다수의 인원인 경우 총 예산을 기준으로 선택해주세요
                  </Text>
                  <View style={styles.tooltipArrow} />
                </Animated.View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowBudgetModal(true)}
          >
            <Text style={[styles.dropdownText, budget === '나의 예산' && styles.placeholderText]}>
              {budget}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.labelText}>인원 수</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowPeopleModal(true)}
          >
            <Text style={[styles.dropdownText, peopleCount === '인원 수' && styles.placeholderText]}>
              {peopleCount}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.labelText}>일정</Text>
            {departureDate && arrivalDate && (
              <Text style={styles.nightsText}>{calculateNights()}</Text>
            )}
          </View>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={openDeparturePicker}
            >
              <Text style={[styles.dateButtonText, !departureDate && styles.placeholderText]}>
                {departureDate ? formatDate(departureDate) : '출발일자'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>~</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={openArrivalPicker}
            >
              <Text style={[styles.dateButtonText, !arrivalDate && styles.placeholderText]}>
                {arrivalDate ? formatDate(arrivalDate) : '도착일자'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isDomestic ? (
          // 해외: 출발/귀국 공항
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.labelText}>출발 공항</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDepartureAirportModal(true)}
              >
                <Text style={[styles.dropdownText, departureAirport === '출발 공항' && styles.placeholderText]}>
                  {departureAirport}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.labelText}>귀국 공항</Text>
                <Text style={styles.helperText}>돌아올 때 도착할 공항</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowReturnAirportModal(true)}
              >
                <Text style={[styles.dropdownText, returnAirport === '귀국 공항' && styles.placeholderText]}>
                  {returnAirport}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // 국내: 기차/비행기 선택
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.labelText}>교통수단</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, transportType === 'train' && styles.toggleButtonActive]}
                  onPress={() => {
                    setTransportType('train');
                    setDepartureStation('출발역');
                    setReturnStation('도착역');
                  }}
                >
                  <Text style={[styles.toggleButtonText, transportType === 'train' && styles.toggleButtonTextActive]}>
                    기차
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, transportType === 'flight' && styles.toggleButtonActive]}
                  onPress={() => {
                    setTransportType('flight');
                    setDepartureStation('출발 공항');
                    setReturnStation('귀국 공항');
                  }}
                >
                  <Text style={[styles.toggleButtonText, transportType === 'flight' && styles.toggleButtonTextActive]}>
                    비행기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {transportType && (
              <>
                <View style={styles.sectionContainer}>
                  <Text style={styles.labelText}>
                    {transportType === 'train' ? '출발역' : '출발 공항'}
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      if (transportType === 'train') {
                        setShowDepartureStationModal(true);
                      } else {
                        setShowDepartureAirportModal(true);
                      }
                    }}
                  >
                    <Text style={[styles.dropdownText, (departureStation === '출발역' || departureStation === '출발 공항') && styles.placeholderText]}>
                      {departureStation}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sectionContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.labelText}>
                      {transportType === 'train' ? '도착역' : '귀국 공항'}
                    </Text>
                    <Text style={styles.helperText}>
                      {transportType === 'train' ? '돌아올 때 도착할 역' : '돌아올 때 도착할 공항'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      if (transportType === 'train') {
                        setShowReturnStationModal(true);
                      } else {
                        setShowReturnAirportModal(true);
                      }
                    }}
                  >
                    <Text style={[styles.dropdownText, (returnStation === '도착역' || returnStation === '귀국 공항') && styles.placeholderText]}>
                      {returnStation}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>랜덤여행 가기</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showBudgetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBudgetModal(false)}
        >
          <View style={styles.modalContent}>
            {budgetOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setBudget(option);
                  setShowBudgetModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPeopleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPeopleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeopleModal(false)}
        >
          <View style={styles.modalContent}>
            {peopleOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setPeopleCount(option);
                  setShowPeopleModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDeparturePicker || showArrivalPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDeparturePicker(false);
          setShowArrivalPicker(false);
        }}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeparturePicker(false);
                  setShowArrivalPicker(false);
                }}
              >
                <Text style={styles.pickerButtonText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {isSelectingDeparture ? '출발일자 선택' : '도착일자 선택'}
              </Text>
              <TouchableOpacity onPress={confirmDate}>
                <Text style={styles.pickerButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>년</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)
                    .filter((year) => {
                      // 출발일자 선택 시 과거 년도는 표시하지 않음
                      if (isSelectingDeparture) {
                        return year >= new Date().getFullYear();
                      }
                      return true;
                    })
                    .map((year) => {
                      const today = new Date();
                      const isCurrentYear = year === today.getFullYear();
                      
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.datePickerItem, 
                            tempYear === year && styles.datePickerItemSelected
                          ]}
                          onPress={() => {
                            setTempYear(year);
                            // 년도 변경 시 월/일도 유효한 범위로 조정
                            if (isCurrentYear && tempMonth < today.getMonth() + 1) {
                              setTempMonth(today.getMonth() + 1);
                              setTempDay(today.getDate());
                            }
                          }}
                        >
                          <Text style={[
                            styles.datePickerItemText, 
                            tempYear === year && styles.datePickerItemTextSelected
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>월</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {Array.from({ length: 12 }, (_, i) => i + 1)
                    .filter((month) => {
                      const today = new Date();
                      // 출발일자 선택 시 과거 월은 표시하지 않음
                      if (isSelectingDeparture && tempYear === today.getFullYear()) {
                        return month >= today.getMonth() + 1;
                      }
                      return true;
                    })
                    .map((month) => {
                      const today = new Date();
                      const isCurrentMonth = tempYear === today.getFullYear() && month === today.getMonth() + 1;
                      
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.datePickerItem, 
                            tempMonth === month && styles.datePickerItemSelected
                          ]}
                          onPress={() => {
                            setTempMonth(month);
                            const daysInMonth = getDaysInMonth(tempYear, month);
                            if (tempDay > daysInMonth) {
                              setTempDay(daysInMonth);
                            }
                            // 현재 월인 경우 오늘 날짜 이후만 선택 가능하도록 일 조정
                            if (isCurrentMonth && tempDay < today.getDate()) {
                              setTempDay(today.getDate());
                            }
                          }}
                        >
                          <Text style={[
                            styles.datePickerItemText, 
                            tempMonth === month && styles.datePickerItemTextSelected
                          ]}>
                            {month}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>일</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1)
                    .filter((day) => {
                      if (isSelectingDeparture) {
                        // 출발일자 선택 시 과거 날짜는 표시하지 않음
                        return !isDateInPast(tempYear, tempMonth, day);
                      } else {
                        // 도착일자 선택 시 출발일자 이후만 표시
                        if (departureDate) {
                          const date = new Date(tempYear, tempMonth - 1, day);
                          date.setHours(0, 0, 0, 0);
                          const depDate = new Date(departureDate);
                          depDate.setHours(0, 0, 0, 0);
                          return date >= depDate;
                        } else {
                          // 출발일자가 없으면 과거 날짜만 제외
                          return !isDateInPast(tempYear, tempMonth, day);
                        }
                      }
                    })
                    .map((day) => {
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.datePickerItem, 
                            tempDay === day && styles.datePickerItemSelected
                          ]}
                          onPress={() => {
                            setTempDay(day);
                          }}
                        >
                          <Text style={[
                            styles.datePickerItemText, 
                            tempDay === day && styles.datePickerItemTextSelected
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 필수값 검증 모달 */}
      <Modal
        transparent={true}
        visible={showValidationModal}
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <TouchableOpacity
          style={styles.validationModalOverlay}
          activeOpacity={1}
          onPress={() => setShowValidationModal(false)}
        >
          <View style={styles.validationModalContent}>
            <Text style={styles.validationModalTitle}>입력 필요</Text>
            <Text style={styles.validationModalMessage}>{validationMessage}</Text>
            <TouchableOpacity
              style={styles.validationModalButton}
              onPress={() => setShowValidationModal(false)}
            >
              <Text style={styles.validationModalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 해외 출발 공항 선택 모달 */}
      <Modal
        visible={showDepartureAirportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepartureAirportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDepartureAirportModal(false)}
        >
          <View style={styles.modalContent}>
            {domesticAirports.map((airport) => (
              <TouchableOpacity
                key={airport.code}
                style={styles.modalOption}
                onPress={() => {
                  if (isDomestic && transportType === 'flight') {
                    setDepartureStation(airport.name);
                  } else {
                    setDepartureAirport(airport.name);
                  }
                  setShowDepartureAirportModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{airport.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 해외 귀국 공항 선택 모달 */}
      <Modal
        visible={showReturnAirportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReturnAirportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReturnAirportModal(false)}
        >
          <View style={styles.modalContent}>
            {domesticAirports.map((airport) => (
              <TouchableOpacity
                key={airport.code}
                style={styles.modalOption}
                onPress={() => {
                  if (isDomestic && transportType === 'flight') {
                    setReturnStation(airport.name);
                  } else {
                    setReturnAirport(airport.name);
                  }
                  setShowReturnAirportModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{airport.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 국내 출발역 선택 모달 */}
      <Modal
        visible={showDepartureStationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepartureStationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDepartureStationModal(false)}
        >
          <View style={styles.modalContent}>
            {domesticStations.map((station) => (
              <TouchableOpacity
                key={station.code}
                style={styles.modalOption}
                onPress={() => {
                  setDepartureStation(station.name);
                  setShowDepartureStationModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{station.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 국내 도착역 선택 모달 */}
      <Modal
        visible={showReturnStationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReturnStationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReturnStationModal(false)}
        >
          <View style={styles.modalContent}>
            {domesticStations.map((station) => (
              <TouchableOpacity
                key={station.code}
                style={styles.modalOption}
                onPress={() => {
                  setReturnStation(station.name);
                  setShowReturnStationModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{station.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  titleText: {
    fontSize: 25,
    fontFamily: 'Juache',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    padding: 0,
  },
  currencyText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    marginLeft: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  labelText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#333333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#333333',
    marginBottom: 10,
  },
  dropdownButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666666',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
  },
  dateSeparator: {
    fontSize: 18,
    fontFamily: 'Juache',
    color: '#666666',
    marginHorizontal: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nightsText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
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
  nextButtonText: {
    color: '#333333',
    fontSize: 18,
    fontFamily: 'Juache',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  pickerButtonText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  datePickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingVertical: 20,
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
    marginBottom: 8,
  },
  datePickerScroll: {
    flex: 1,
    width: '100%',
  },
  datePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  datePickerItemSelected: {
    backgroundColor: '#D7E3A1',
    borderRadius: 8,
  },
  datePickerItemText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
  },
  datePickerItemTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  datePickerItemDisabled: {
    opacity: 0.3,
  },
  datePickerItemTextDisabled: {
    color: '#cccccc',
  },
  validationModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  validationModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  validationModalTitle: {
    fontSize: 20,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  validationModalMessage: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  validationModalButton: {
    backgroundColor: '#D7E3A1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  validationModalButtonText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#D7E3A1',
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
  },
  toggleButtonTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  labelWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tooltipContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  icon: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    top: -1,
  },
  tooltip: {
    position: 'absolute',
    top: -5,
    left: 30,
    width: 200,
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 10,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: 'Juache',
    color: '#fff',
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    left: -5,
    top: '50%',
    marginTop: -5,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#333',
  },
});

