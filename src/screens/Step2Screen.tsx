import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity, Animated, TextInput, ScrollView, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Step2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [budget, setBudget] = useState('');
  const [peopleCount, setPeopleCount] = useState('인원 수');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [preferredRegion, setPreferredRegion] = useState('');
  const [showPeopleModal, setShowPeopleModal] = useState(false);

  const peopleOptions = ['1명', '2명', '3명', '4명', '5명', '6명','7명','8명','9명','10명'];

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
    // Step3 또는 결과 화면으로 이동
    navigation.navigate('Home');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const calculateNights = (): string => {
    if (!departureDate || !arrivalDate) return '';
    if (arrivalDate <= departureDate) return '';
    
    const diffTime = arrivalDate.getTime() - departureDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays - 1;
    
    if (nights === 0) return '당일치기';
    return `${nights}박 ${diffDays}일`;
  };

  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [isSelectingDeparture, setIsSelectingDeparture] = useState(true);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const confirmDate = () => {
    const selectedDate = new Date(tempYear, tempMonth - 1, tempDay);
    if (isSelectingDeparture) {
      setDepartureDate(selectedDate);
      if (arrivalDate && selectedDate > arrivalDate) {
        setArrivalDate(null);
      }
      setShowDeparturePicker(false);
    } else {
      if (departureDate && selectedDate >= departureDate) {
        setArrivalDate(selectedDate);
      } else if (!departureDate) {
        setArrivalDate(selectedDate);
      }
      setShowArrivalPicker(false);
    }
  };

  const openDeparturePicker = () => {
    if (departureDate) {
      setTempYear(departureDate.getFullYear());
      setTempMonth(departureDate.getMonth() + 1);
      setTempDay(departureDate.getDate());
    }
    setIsSelectingDeparture(true);
    setShowDeparturePicker(true);
  };

  const openArrivalPicker = () => {
    if (arrivalDate) {
      setTempYear(arrivalDate.getFullYear());
      setTempMonth(arrivalDate.getMonth() + 1);
      setTempDay(arrivalDate.getDate());
    } else if (departureDate) {
      setTempYear(departureDate.getFullYear());
      setTempMonth(departureDate.getMonth() + 1);
      setTempDay(departureDate.getDate());
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
          <Text style={styles.labelText}>나의 예산</Text>
          <View style={styles.budgetInputWrapper}>
            <TextInput
              style={styles.budgetInput}
              placeholder="ex)1000000"
              placeholderTextColor="#999999"
              value={budget}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setBudget(numericValue);
              }}
              keyboardType="numeric"
            />
            <Text style={styles.currencyText}>원</Text>
          </View>
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
          <Text style={styles.labelText}>일정</Text>
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
          {departureDate && arrivalDate && (
            <Text style={styles.nightsText}>{calculateNights()}</Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.labelText}>선호지역 (선택)</Text>
          <TextInput
            style={styles.input}
            placeholder="선호하는 지역 적기"
            placeholderTextColor="#999999"
            value={preferredRegion}
            onChangeText={setPreferredRegion}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>BARU 가기</Text>
        </TouchableOpacity>
      </View>

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
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.datePickerItem, tempYear === year && styles.datePickerItemSelected]}
                      onPress={() => setTempYear(year)}
                    >
                      <Text style={[styles.datePickerItemText, tempYear === year && styles.datePickerItemTextSelected]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>월</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.datePickerItem, tempMonth === month && styles.datePickerItemSelected]}
                      onPress={() => {
                        setTempMonth(month);
                        const daysInMonth = getDaysInMonth(tempYear, month);
                        if (tempDay > daysInMonth) {
                          setTempDay(daysInMonth);
                        }
                      }}
                    >
                      <Text style={[styles.datePickerItemText, tempMonth === month && styles.datePickerItemTextSelected]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>일</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.datePickerItem, tempDay === day && styles.datePickerItemSelected]}
                      onPress={() => setTempDay(day)}
                    >
                      <Text style={[styles.datePickerItemText, tempDay === day && styles.datePickerItemTextSelected]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
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
  nightsText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#D7E3A1',
    marginTop: 8,
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
    color: '#D7E3A1',
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
});

