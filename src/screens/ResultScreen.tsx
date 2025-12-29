import React, { useRef, useState, useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { searchTrip, type TripSearchRequest, type TripSearchResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'Result';
  params: {
    budget?: string;
    peopleCount?: string;
    departureDate?: Date;
    arrivalDate?: Date;
    isDomestic?: boolean;
  };
};

interface TravelItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
}

export interface FlightItem {
  id: string;
  airline: string;
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string;
  price: {
    total: string;
    currency: string;
  };
  destinationName?: string; // 목적지 이름 (여러 목적지 검색 시)
  segments: Array<{
    carrierCode: string;
    flightNumber: string;
    departure: {
      airport: string;
      time: string;
    };
    arrival: {
      airport: string;
      time: string;
    };
  }>;
}

export interface HotelPrice {
  hotelName: string;
  price: number;
  currency: string;
  rating?: number;
}

export interface ExchangeAmount {
  currency: string;
  amount: number;
  exchangeRate: number;
}

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { isLoggedIn } = useAuth();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const [budgetInput, setBudgetInput] = useState(route.params?.budget || '');
  const [currentBudget, setCurrentBudget] = useState(route.params?.budget || ''); // 실제 검색에 사용되는 예산
  const [travelList, setTravelList] = useState<TravelItem[]>([]);
  const [flightList, setFlightList] = useState<FlightItem[]>([]);
  const [hotelPrices, setHotelPrices] = useState<{ [flightId: string]: HotelPrice[] }>({});
  const [exchangeAmounts, setExchangeAmounts] = useState<{ [flightId: string]: ExchangeAmount }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hotels' | 'flights'>('flights');
  const [sortBy, setSortBy] = useState<'price' | 'time'>('price'); // 정렬 기준: 가격 또는 출발시간
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // 'asc': 낮은순/빠른순, 'desc': 높은순/느린순
  const [showSortModal, setShowSortModal] = useState(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  const [pendingDetailParams, setPendingDetailParams] = useState<{
    flight: FlightItem;
    hotels: HotelPrice[];
    exchange?: ExchangeAmount;
    budget?: string;
    peopleCount?: string;
    departureDate?: Date;
    arrivalDate?: Date;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'flights') {
      fetchFlightList();
    } else {
      fetchTravelList();
    }
  }, [currentBudget, activeTab]); // budgetInput 대신 currentBudget 사용

  useEffect(() => {
    // 정렬 적용
    if (activeTab === 'flights' && flightList.length > 0) {
      console.log('정렬 적용:', { sortBy, sortOrder, flightListLength: flightList.length });
      const sorted = [...flightList].sort((a, b) => {
        if (sortBy === 'price') {
          // 가격 기준 정렬
          const priceA = parseFloat(a.price.total) || 0;
          const priceB = parseFloat(b.price.total) || 0;
          return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
        } else {
          // 출발시간 기준 정렬
          const timeA = a.departure.time || '';
          const timeB = b.departure.time || '';
          if (!timeA || !timeB) return 0;
          
          // 시간 문자열 파싱 (오전/오후 제거, HH:MM 형식으로 변환)
          const parseTime = (timeStr: string): number => {
            // "오전 09:00" 또는 "09:00" 형식 처리
            const cleaned = timeStr.replace(/오전|오후|AM|PM/gi, '').trim();
            const parts = cleaned.split(':');
            if (parts.length !== 2) return 0;
            const hour = parseInt(parts[0], 10) || 0;
            const minute = parseInt(parts[1], 10) || 0;
            // 오후 시간 처리 (12시 이후)
            let totalHour = hour;
            if (timeStr.includes('오후') || timeStr.includes('PM')) {
              if (hour !== 12) totalHour = hour + 12;
            } else if (timeStr.includes('오전') || timeStr.includes('AM')) {
              if (hour === 12) totalHour = 0;
            }
            return totalHour * 60 + minute;
          };
          
          const totalMinutesA = parseTime(timeA);
          const totalMinutesB = parseTime(timeB);
          return sortOrder === 'asc' ? totalMinutesA - totalMinutesB : totalMinutesB - totalMinutesA;
        }
      });
      // 무한 루프 방지를 위해 값이 실제로 변경되었을 때만 업데이트
      let shouldUpdate = false;
      if (sortBy === 'price') {
        const currentFirstPrice = parseFloat(flightList[0]?.price.total || '0');
        const sortedFirstPrice = parseFloat(sorted[0]?.price.total || '0');
        shouldUpdate = currentFirstPrice !== sortedFirstPrice || flightList.length !== sorted.length;
      } else {
        // 출발시간 기준 정렬
        const currentFirstTime = flightList[0]?.departure.time || '';
        const sortedFirstTime = sorted[0]?.departure.time || '';
        shouldUpdate = currentFirstTime !== sortedFirstTime || flightList.length !== sorted.length;
      }
      if (shouldUpdate) {
        setFlightList(sorted);
      }
    } else if (activeTab === 'hotels' && travelList.length > 0) {
      const sorted = [...travelList].sort((a, b) => {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      });
      const currentFirstPrice = travelList[0]?.price || 0;
      const sortedFirstPrice = sorted[0]?.price || 0;
      if (currentFirstPrice !== sortedFirstPrice || travelList.length !== sorted.length) {
        setTravelList(sorted);
      }
    }
  }, [sortOrder, sortBy, activeTab]);

  const fetchFlightList = async () => {
    try {
      setLoading(true);
      
      const departureDate = route.params?.departureDate;
      const arrivalDate = route.params?.arrivalDate;
      const peopleCount = route.params?.peopleCount || '1명';
      const people = parseInt(peopleCount.replace('명', '')) || 1;

      if (!departureDate || !arrivalDate) {
        console.error('출발일자 또는 도착일자가 없습니다.');
        setLoading(false);
        return;
      }

      // 날짜 포맷팅 (YYYY-MM-DD)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // 예산을 원 단위로 변환 (만원 단위를 원 단위로) - 필수값
      if (!currentBudget || currentBudget.trim() === '') {
        console.error('예산이 입력되지 않았습니다.');
        setLoading(false);
        setFlightList([]);
        return;
      }

      const budgetValue = parseInt(currentBudget.replace(/[^0-9]/g, '')) || 0;
      if (budgetValue <= 0) {
        console.error('유효한 예산을 입력해주세요.');
        setLoading(false);
        setFlightList([]);
        return;
      }

      const budgetWon = budgetValue * 10000; // 만원을 원으로 변환

      // 백엔드 통합 API 호출
      // 백엔드는 영어 지역 코드를 기대하므로 변환
      // 국내는 null로 전달하여 백엔드가 기본값 처리하도록 함
      const preferredRegion = route.params?.isDomestic 
        ? null // 국내는 백엔드에서 기본값 처리
        : 'JAPAN'; // 국외는 일본으로 기본 설정 (실제로는 사용자 선택에 따라 변경 가능)
      
      const searchParams: TripSearchRequest = {
        budgetWon,
        people,
        departDate: formatDate(departureDate),
        returnDate: formatDate(arrivalDate),
        preferredRegion: preferredRegion || undefined,
      };

      console.log('백엔드 API 호출 시작:', searchParams);
      const response = await searchTrip(searchParams);

      console.log('백엔드 여행 검색 응답 전체:', JSON.stringify(response, null, 2));
      console.log('응답 success:', response.success);
      console.log('응답 error:', response.error);
      console.log('응답 message:', response.message);
      console.log('응답 data:', response.data);

      if (response.success && response.data) {
        const tripData = response.data;
        
        console.log('tripData 전체:', JSON.stringify(tripData, null, 2));
        console.log('tripData.flights:', tripData.flights);
        console.log('tripData.flights 타입:', typeof tripData.flights);
        console.log('tripData.flights 배열 여부:', Array.isArray(tripData.flights));
        
        // 항공권 데이터를 FlightItem 형식으로 변환
        const flightDataArray = tripData.flights || [];
        console.log('항공권 데이터 배열:', flightDataArray);
        console.log('항공권 개수:', flightDataArray.length);
        
        if (flightDataArray.length === 0) {
          console.warn('⚠️ 백엔드에서 항공권 데이터가 비어있습니다!');
          console.warn('백엔드 응답 전체:', JSON.stringify(tripData, null, 2));
        }
        
        // 항공사 코드를 한글 이름으로 변환하는 매핑
        const airlineNames: { [key: string]: string } = {
          'KE': '대한항공',
          'OZ': '아시아나항공',
          'JL': '일본항공',
          'NH': '전일본공수',
          'TG': '타이항공',
          'SQ': '싱가포르항공',
          'CX': '캐세이퍼시픽',
          'BR': '에바항공',
          'CI': '중화항공',
          'CZ': '중국남방항공',
          'MU': '중국동방항공',
          'CA': '중국국제항공',
          'AA': '아메리칸항공',
          'DL': '델타항공',
          'UA': '유나이티드항공',
          'LH': '루프트한자',
          'AF': '에어프랑스',
          'BA': '영국항공',
          'KL': 'KLM',
          'QF': '콴타스항공',
          'EK': '에미레이트항공',
          'QR': '카타르항공',
          'TK': '터키항공',
          'SU': '아에로플로트',
          'JJ': 'LATAM',
          'AM': '아에로멕시코',
          'AC': '에어캐나다',
          'NZ': '에어뉴질랜드',
          'VN': '베트남항공',
          'PR': '필리핀항공',
          '5J': '세부퍼시픽',
          '7C': '제주항공',
          'TW': '티웨이항공',
          'LJ': '진에어',
          'BX': '에어부산',
          'ZE': '이스타항공',
          'RS': '플라이강원',
          '4V': '에어로케이',
        };

        const allFlights: FlightItem[] = flightDataArray.map((flight, index) => {
          // durationMinutes를 PT 형식으로 변환
          const hours = Math.floor(flight.durationMinutes / 60);
          const minutes = flight.durationMinutes % 60;
          const duration = `PT${hours}H${minutes}M`;

          // 항공사 코드를 한글 이름으로 변환
          const airlineCode = flight.airline || '';
          const airlineName = airlineNames[airlineCode] || airlineCode || '알 수 없음';

          // 고유 ID 생성: 인덱스와 모든 주요 정보를 포함하여 고유성 보장
          const firstSegment = flight.segments?.[0];
          const segmentInfo = firstSegment ? `${firstSegment.flightNo}-${firstSegment.depTime}` : '';
          const uniqueId = `flight-${index}-${flight.departureAirport}-${flight.arrivalAirport}-${flight.departureTime}-${flight.priceWon}-${segmentInfo}`;

          const flightItem: FlightItem = {
            id: uniqueId,
            airline: airlineName,
            departure: {
              airport: flight.departureAirport || '',
              time: flight.departureTime || '',
            },
            arrival: {
              airport: flight.arrivalAirport || '',
              time: flight.arrivalTime || '',
            },
            duration: duration,
            price: {
              total: flight.priceWon.toString(),
              currency: 'KRW',
            },
            segments: flight.segments?.map(seg => ({
              carrierCode: seg.flightNo.substring(0, 2) || '',
              flightNumber: seg.flightNo,
              departure: {
                airport: seg.from,
                time: seg.depTime,
              },
              arrival: {
                airport: seg.to,
                time: seg.arrTime,
              },
            })) || [],
          };

          return flightItem;
        });

        console.log('변환된 항공권 개수:', allFlights.length);
        console.log('변환된 항공권 목록:', allFlights.map(f => ({
          id: f.id,
          airline: f.airline,
          route: `${f.departure.airport} -> ${f.arrival.airport}`,
          time: f.departure.time,
          price: f.price.total,
        })));

        // 백엔드에서 이미 필터링된 데이터이므로, 완전히 동일한 항공권만 제거
        // (편명, 출발/도착 공항, 출발 시간, 가격이 모두 동일한 경우만)
        const uniqueFlights = allFlights.filter((flight, index, self) => {
          const uniqueKey = `${flight.airline}-${flight.departure.airport}-${flight.arrival.airport}-${flight.departure.time}-${flight.price.total}-${flight.segments[0]?.flightNumber || ''}`;
          return index === self.findIndex(f => {
            const fKey = `${f.airline}-${f.departure.airport}-${f.arrival.airport}-${f.departure.time}-${f.price.total}-${f.segments[0]?.flightNumber || ''}`;
            return fKey === uniqueKey;
          });
        });

        console.log('중복 제거 후 항공권 개수:', uniqueFlights.length);
        console.log('최종 항공권 목록:', uniqueFlights.map(f => ({
          airline: f.airline,
          route: `${f.departure.airport} -> ${f.arrival.airport}`,
          time: f.departure.time,
          price: f.price.total,
        })));

        // 정렬 적용
        const sorted = [...uniqueFlights].sort((a, b) => {
          if (sortBy === 'price') {
            const priceA = parseFloat(a.price.total) || 0;
            const priceB = parseFloat(b.price.total) || 0;
            return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
          } else {
            const timeA = a.departure.time || '';
            const timeB = b.departure.time || '';
            if (!timeA || !timeB) return 0;
            
            const parseTime = (timeStr: string): number => {
              const cleaned = timeStr.replace(/오전|오후|AM|PM/gi, '').trim();
              const parts = cleaned.split(':');
              if (parts.length !== 2) return 0;
              const hour = parseInt(parts[0], 10) || 0;
              const minute = parseInt(parts[1], 10) || 0;
              let totalHour = hour;
              if (timeStr.includes('오후') || timeStr.includes('PM')) {
                if (hour !== 12) totalHour = hour + 12;
              } else if (timeStr.includes('오전') || timeStr.includes('AM')) {
                if (hour === 12) totalHour = 0;
              }
              return totalHour * 60 + minute;
            };
            
            const totalMinutesA = parseTime(timeA);
            const totalMinutesB = parseTime(timeB);
            return sortOrder === 'asc' ? totalMinutesA - totalMinutesB : totalMinutesB - totalMinutesA;
          }
        });

        setFlightList(sorted);
        
        // 백엔드에서 받은 환율 정보를 각 항공권에 적용
        if (tripData.exchange) {
          const exchangeRates = tripData.exchange.rates;
          sorted.forEach((flight) => {
            // 도착 공항에 따른 통화 결정
            const arrivalAirport = flight.arrival.airport;
            let toCurrency = 'USD';
            let exchangeRate = exchangeRates.USD || 1;
            
            if (arrivalAirport === 'NRT' || arrivalAirport === 'HND' || arrivalAirport === 'KIX') {
              toCurrency = 'JPY';
              exchangeRate = exchangeRates.JPY || 1;
            }
            
            const flightPrice = parseFloat(flight.price.total) || 0;
            const convertedAmount = flightPrice / exchangeRate;
            
            setExchangeAmounts(prev => ({
              ...prev,
              [flight.id]: {
                currency: toCurrency,
                amount: convertedAmount,
                exchangeRate: exchangeRate,
              },
            }));
          });
        }

        // 호텔 정보는 백엔드에서 제공되면 처리
        // 백엔드에서 받은 호텔 데이터를 각 항공권에 매핑
        if (tripData.hotels && Array.isArray(tripData.hotels) && tripData.hotels.length > 0) {
          console.log('호텔 데이터:', tripData.hotels);
          
          // 호텔 데이터를 항공권별로 매핑 (백엔드 구조에 맞게 수정 필요)
          // 현재는 전체 호텔 데이터를 모든 항공권에 적용
          sorted.forEach((flight) => {
            const hotelList: HotelPrice[] = tripData.hotels.map((hotel: any) => ({
              hotelName: hotel.hotelName || hotel.name || '호텔명 없음',
              price: hotel.price || hotel.priceWon || 0,
              currency: hotel.currency || 'KRW',
              rating: hotel.rating || undefined,
            }));
            
            if (hotelList.length > 0) {
              setHotelPrices(prev => ({
                ...prev,
                [flight.id]: hotelList,
              }));
            }
          });
        } else {
          console.log('호텔 데이터가 없습니다.');
        }
      } else {
        console.error('백엔드 여행 검색 실패:', response.error);
        console.error('에러 메시지:', response.message);
        setFlightList([]);
        
        // 에러 알림 (선택사항)
        if (response.message) {
          console.warn('API 호출 실패:', response.message);
        }
      }
    } catch (error) {
      console.error('Error fetching flight list:', error);
      console.error('에러 상세:', error instanceof Error ? error.message : String(error));
      setFlightList([]);
      
      // 네트워크 오류 등 상세 로그
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          console.error('네트워크 연결 실패 - 백엔드 서버가 실행 중인지 확인하세요');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 API에서 호텔 정보를 받아오므로 이 함수는 더 이상 사용하지 않음
  // const fetchHotelPrices = async (flight: FlightItem) => { ... }

  // 백엔드 API에서 환율 정보를 받아오므로 이 함수는 더 이상 사용하지 않음
  // const fetchExchangeAmount = async (flight: FlightItem) => { ... }

  const fetchTravelList = async () => {
    try {
      setLoading(true);
      
      // TODO: 백엔드 API 연동
      // const response = await fetch(`YOUR_API_URL/travels?budget=${selectedBudget}&people=${route.params?.peopleCount}&departure=${route.params?.departureDate}&arrival=${route.params?.arrivalDate}`);
      // const data = await response.json();
      // setTravelList(data);
      
      
    } catch (error) {
      console.error('Error fetching travel list:', error);
      setLoading(false);
    }
  };

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

  const formatPrice = (price: number): string => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const formatFlightPrice = (price: string, currency: string): string => {
    const numPrice = parseFloat(price) || 0;
    if (currency === 'KRW') {
      return numPrice.toLocaleString('ko-KR') + '원';
    }
    return `${currency} ${numPrice.toLocaleString('ko-KR')}`;
  };

  const formatDuration = (duration: string): string => {
    // PT2H30M 형식을 "2시간 30분"으로 변환
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else if (minutes > 0) {
      return `${minutes}분`;
    }
    return duration;
  };

  const getCityName = (airportCode: string, destinationName?: string): string => {
    // 공항 코드를 대문자로 변환 (일관성을 위해)
    const normalizedCode = airportCode?.toUpperCase() || '';
    
    console.log('getCityName 호출:', { airportCode, normalizedCode, destinationName });
    
    // 공항 코드를 한글/영어 도시명으로 매핑
    const airportToCity: { [key: string]: { korean: string; english: string } } = {
      // 일본
      'NRT': { korean: '도쿄', english: 'Tokyo' },
      'HND': { korean: '도쿄', english: 'Tokyo' },
      'KIX': { korean: '오사카', english: 'Osaka' },
      'CTS': { korean: '삿포로', english: 'Sapporo' },
      'FUK': { korean: '후쿠오카', english: 'Fukuoka' },
      'NGO': { korean: '나고야', english: 'Nagoya' },
      // 중국
      'PEK': { korean: '베이징', english: 'Beijing' },
      'PVG': { korean: '상하이', english: 'Shanghai' },
      'CAN': { korean: '광저우', english: 'Guangzhou' },
      'SZX': { korean: '선전', english: 'Shenzhen' },
      'CTU': { korean: '청두', english: 'Chengdu' },
      'XIY': { korean: '시안', english: 'Xi\'an' },
      'TAO': { korean: '칭다오', english: 'Qingdao' },
      'DLC': { korean: '다롄', english: 'Dalian' },
      // 태국
      'BKK': { korean: '방콕', english: 'Bangkok' },
      'DMK': { korean: '방콕', english: 'Bangkok' },
      'HKT': { korean: '푸켓', english: 'Phuket' },
      'CNX': { korean: '치앙마이', english: 'Chiang Mai' },
      // 베트남
      'SGN': { korean: '호치민', english: 'Ho Chi Minh City' },
      'HAN': { korean: '하노이', english: 'Hanoi' },
      'DAD': { korean: '다낭', english: 'Da Nang' },
      // 필리핀
      'MNL': { korean: '마닐라', english: 'Manila' },
      'CEB': { korean: '세부', english: 'Cebu' },
      // 싱가포르
      'SIN': { korean: '싱가포르', english: 'Singapore' },
      // 말레이시아
      'KUL': { korean: '쿠알라룸푸르', english: 'Kuala Lumpur' },
      // 인도네시아
      'CGK': { korean: '자카르타', english: 'Jakarta' },
      'DPS': { korean: '발리', english: 'Bali' },
      // 홍콩/마카오
      'HKG': { korean: '홍콩', english: 'Hong Kong' },
      'MFM': { korean: '마카오', english: 'Macau' },
      // 대만
      'TPE': { korean: '타이베이', english: 'Taipei' },
      'KHH': { korean: '가오슝', english: 'Kaohsiung' },
      // 인도
      'DEL': { korean: '델리', english: 'Delhi' },
      'BOM': { korean: '뭄바이', english: 'Mumbai' },
      // 아랍에미리트
      'DXB': { korean: '두바이', english: 'Dubai' },
      'AUH': { korean: '아부다비', english: 'Abu Dhabi' },
      // 사우디아라비아
      'RUH': { korean: '리야드', english: 'Riyadh' },
      'JED': { korean: '제다', english: 'Jeddah' },
      // 터키
      'IST': { korean: '이스탄불', english: 'Istanbul' },
      // 영국
      'LHR': { korean: '런던', english: 'London' },
      'LGW': { korean: '런던', english: 'London' },
      // 프랑스
      'CDG': { korean: '파리', english: 'Paris' },
      'ORY': { korean: '파리', english: 'Paris' },
      // 독일
      'FRA': { korean: '프랑크푸르트', english: 'Frankfurt' },
      'MUC': { korean: '뮌헨', english: 'Munich' },
      // 이탈리아
      'FCO': { korean: '로마', english: 'Rome' },
      'MXP': { korean: '밀라노', english: 'Milan' },
      // 스페인
      'MAD': { korean: '마드리드', english: 'Madrid' },
      'BCN': { korean: '바르셀로나', english: 'Barcelona' },
      // 네덜란드
      'AMS': { korean: '암스테르담', english: 'Amsterdam' },
      // 러시아
      'SVO': { korean: '모스크바', english: 'Moscow' },
      'LED': { korean: '상트페테르부르크', english: 'Saint Petersburg' },
      // 미국
      'JFK': { korean: '뉴욕', english: 'New York' },
      'LAX': { korean: '로스앤젤레스', english: 'Los Angeles' },
      'SFO': { korean: '샌프란시스코', english: 'San Francisco' },
      'ORD': { korean: '시카고', english: 'Chicago' },
      'MIA': { korean: '마이애미', english: 'Miami' },
      'SEA': { korean: '시애틀', english: 'Seattle' },
      'BOS': { korean: '보스턴', english: 'Boston' },
      'IAD': { korean: '워싱턴', english: 'Washington' },
      'ATL': { korean: '애틀랜타', english: 'Atlanta' },
      'DFW': { korean: '댈러스', english: 'Dallas' },
      // 캐나다
      'YYZ': { korean: '토론토', english: 'Toronto' },
      'YVR': { korean: '밴쿠버', english: 'Vancouver' },
      // 호주
      'SYD': { korean: '시드니', english: 'Sydney' },
      'MEL': { korean: '멜버른', english: 'Melbourne' },
      'BNE': { korean: '브리즈번', english: 'Brisbane' },
      // 뉴질랜드
      'AKL': { korean: '오클랜드', english: 'Auckland' },
      // 브라질
      'GRU': { korean: '상파울루', english: 'Sao Paulo' },
      'GIG': { korean: '리우데자네이루', english: 'Rio de Janeiro' },
      // 아르헨티나
      'EZE': { korean: '부에노스아이레스', english: 'Buenos Aires' },
      // 남아프리카
      'JNB': { korean: '요하네스버그', english: 'Johannesburg' },
      'CPT': { korean: '케이프타운', english: 'Cape Town' },
      // 이집트
      'CAI': { korean: '카이로', english: 'Cairo' },
      // 국내
      'ICN': { korean: '서울', english: 'Seoul' },
      'GMP': { korean: '서울', english: 'Seoul' },
      'CJU': { korean: '제주', english: 'Jeju' },
      'PUS': { korean: '부산', english: 'Busan' },
    };

    const cityInfo = airportToCity[normalizedCode];
    if (cityInfo) {
      console.log('도시명 매핑 성공:', cityInfo);
      return `${cityInfo.korean}(${cityInfo.english})`;
    }
    
    // destinationName이 있으면 사용
    if (destinationName) {
      console.log('destinationName 사용:', destinationName);
      return destinationName;
    }
    
    console.log('도시명 매핑 실패, 공항 코드 반환:', normalizedCode);
    return normalizedCode || 'N/A';
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
        <View style={styles.filterContainer}>
          <View style={styles.budgetInputContainer}>
            <TextInput
              style={styles.budgetInput}
              placeholder="예산 (만원)"
              placeholderTextColor="#999999"
              value={budgetInput}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setBudgetInput(numericValue);
              }}
              keyboardType="numeric"
            />
            <Text style={styles.budgetUnit}>만원</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (budgetInput && budgetInput.trim() !== '') {
                setCurrentBudget(budgetInput);
              }
            }}
          >
            <Text style={styles.searchButtonText}>재검색</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortDropdownButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortDropdownText}>
              {sortBy === 'price' 
                ? (sortOrder === 'asc' ? '가격 낮은순' : '가격 높은순')
                : (sortOrder === 'asc' ? '출발 빠른순' : '출발 느린순')
              }
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D7E3A1" />
            <Text style={styles.loadingText}>
              {activeTab === 'flights' ? '항공권을 불러오는 중...' : '여행지를 불러오는 중...'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {activeTab === 'flights' ? (
              flightList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>조건에 맞는 항공권이 없습니다.</Text>
                </View>
              ) : (
                flightList.map((flight, index) => {
                  const hotels = hotelPrices[flight.id] || [];
                  const exchange = exchangeAmounts[flight.id];
                  
                  // 디버깅: 항공권 정보 확인
                  console.log(`항공권 ${index}:`, {
                    arrivalAirport: flight.arrival.airport,
                    destinationName: flight.destinationName,
                    airline: flight.airline,
                  });
                  
                  // 위치 정보 (도착 도시명, 영어)
                  const locationText = getCityName(flight.arrival.airport, flight.destinationName) || 'N/A';
                  
                  console.log(`위치 텍스트 ${index}:`, locationText);
                  
                  // 비행기 가격
                  const flightPriceText = formatFlightPrice(flight.price.total, flight.price.currency);
                  
                  // 호텔 가격 (첫 번째 호텔 가격 또는 없음)
                  const hotelPriceText = hotels.length > 0 
                    ? formatPrice(hotels[0].price) 
                    : '정보 없음';
                  
                  // 환전가능 금액
                  const exchangeText = exchange 
                    ? `${exchange.amount.toLocaleString()} ${exchange.currency}`
                    : '정보 없음';
                  
                  return (
                    <TouchableOpacity
                      key={`flight-${flight.id}-${index}-${flight.departure.time}-${flight.price.total}`}
                      style={styles.flightItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        const detailParams = {
                          flight,
                          hotels,
                          exchange,
                          budget: currentBudget,
                          peopleCount: route.params?.peopleCount,
                          departureDate: route.params?.departureDate,
                          arrivalDate: route.params?.arrivalDate,
                        };

                        if (isLoggedIn) {
                          // 로그인 상태면 바로 상세 화면으로 이동
                          navigation.navigate('Detail', detailParams);
                        } else {
                          // 비로그인 상태면 모달 표시
                          setPendingDetailParams(detailParams);
                          setShowLoginRequiredModal(true);
                        }
                      }}
                    >
                      {/* 첫 번째 줄: 위치 (영어) */}
                      <View style={styles.listRow}>
                        <Image
                          source={require('../../assets/marker.png')}
                          style={styles.listRowIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.listRowText}>{locationText}</Text>
                      </View>
                      
                      {/* 두 번째 줄: 비행기값 */}
                      <View style={styles.listRow}>
                        <Text style={[styles.listRowText, { flex: 0 }]}>비행기값</Text>
                        <View style={[styles.timeContainer, { flex: 1 }]}>
                          <Text style={styles.timeText}>
                            {flight.departure.time || 'N/A'}
                          </Text>
                          <Image
                            source={require('../../assets/arrows-slim-right.png')}
                            style={styles.arrowIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.timeText}>
                            {flight.arrival.time || 'N/A'}
                          </Text>
                        </View>
                        <Text style={[styles.listRowValue, { flex: 0 }]}>{flightPriceText}</Text>
                      </View>
                      
                      {/* 세 번째 줄: 호텔값 */}
                      <View style={styles.listRow}>
                        <Text style={styles.listRowText}>호텔값</Text>
                        <Text style={styles.listRowValue}>{hotelPriceText}</Text>
                      </View>
                      
                      {/* 네 번째 줄: 환전가능 금액 */}
                      <View style={styles.listRow}>
                        <Text style={styles.listRowText}>환전가능 금액</Text>
                        <Text style={styles.listRowValue}>{exchangeText}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )
            ) : (
              travelList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>조건에 맞는 여행지가 없습니다.</Text>
                </View>
              ) : (
                travelList.map((item, index) => (
                  <TouchableOpacity
                    key={`travel-${item.id}-${index}-${item.price}`}
                    style={styles.listItem}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <Text style={styles.listItemDescription}>{item.description}</Text>
                    <Text style={styles.listItemPrice}>{formatPrice(item.price)}</Text>
                  </TouchableOpacity>
                ))
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* 정렬 선택 모달 */}
      <Modal
        transparent={true}
        visible={showSortModal}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('price');
                setSortOrder('asc');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'price' && sortOrder === 'asc' && styles.modalOptionTextActive]}>
                가격 낮은순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('price');
                setSortOrder('desc');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'price' && sortOrder === 'desc' && styles.modalOptionTextActive]}>
                가격 높은순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('time');
                setSortOrder('asc');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'time' && sortOrder === 'asc' && styles.modalOptionTextActive]}>
                출발 빠른순
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSortBy('time');
                setSortOrder('desc');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === 'time' && sortOrder === 'desc' && styles.modalOptionTextActive]}>
                출발 느린순
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 로그인 필요 모달 */}
      <Modal
        transparent={true}
        visible={showLoginRequiredModal}
        animationType="fade"
        onRequestClose={() => setShowLoginRequiredModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLoginRequiredModal(false)}
        >
          <View style={styles.loginRequiredModalContent}>
            <Text style={styles.loginRequiredModalTitle}>로그인이 필요한 서비스입니다</Text>
            <Text style={styles.loginRequiredModalMessage}>
              상세 정보를 보려면 로그인이 필요합니다.
            </Text>
            <View style={styles.loginRequiredModalButtons}>
              <TouchableOpacity
                style={[styles.loginRequiredModalButton, styles.loginRequiredModalButtonCancel]}
                onPress={() => {
                  setShowLoginRequiredModal(false);
                  setPendingDetailParams(null);
                }}
              >
                <Text style={styles.loginRequiredModalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginRequiredModalButton, styles.loginRequiredModalButtonConfirm]}
                onPress={() => {
                  setShowLoginRequiredModal(false);
                  // Login 화면으로 이동하면서 Detail 파라미터 전달
                  if (pendingDetailParams) {
                    navigation.navigate('Login', {
                      redirectTo: 'Detail',
                      detailParams: pendingDetailParams,
                    });
                  }
                }}
              >
                <Text style={styles.loginRequiredModalButtonConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 20,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#D7E3A1',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  budgetUnit: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    marginLeft: 8,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#D7E3A1',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  sortDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    height: 50,
    minWidth: 100,
  },
  sortDropdownText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#000000',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    width: '60%',
    minWidth: 150,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: '#D7E3A1',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
    marginTop: 16,
  },
  listContainer: {
    gap: 16,
  },
  listItem: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  listItemTitle: {
    fontSize: 20,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItemDescription: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
    marginBottom: 12,
  },
  listItemPrice: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  flightItem: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listRowIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  listRowText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    flex: 1,
  },
  listRowValue: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  timeRow: {
    marginLeft: 0,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    marginHorizontal: 8,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightAirlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flightAirlineLabel: {
    fontSize: 12,
    fontFamily: 'Juache',
    color: '#666666',
  },
  flightAirline: {
    fontSize: 18,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  flightPrice: {
    fontSize: 18,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  flightArrow: {
    fontSize: 18,
    fontFamily: 'Juache',
    color: '#666666',
    marginHorizontal: 8,
  },
  hotelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  hotelLabel: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
    marginRight: 4,
  },
  hotelPrice: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#000000',
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  exchangeLabel: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
    marginRight: 4,
  },
  exchangeAmount: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#D7E3A1',
    fontWeight: 'bold',
  },
  flightRouteItem: {
    flex: 1,
    alignItems: 'center',
  },
  flightAirport: {
    fontSize: 20,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  flightTime: {
    fontSize: 14,
    fontFamily: 'Juache',
    color: '#666666',
  },
  flightRouteMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  flightDuration: {
    fontSize: 12,
    fontFamily: 'Juache',
    color: '#666666',
    marginBottom: 8,
  },
  flightRouteLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  flightInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  flightSegments: {
    fontSize: 12,
    fontFamily: 'Juache',
    color: '#666666',
  },
  flightNumber: {
    fontSize: 12,
    fontFamily: 'Juache',
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
  },
  loginRequiredModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loginRequiredModalTitle: {
    fontSize: 20,
    fontFamily: 'Juache',
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loginRequiredModalMessage: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  loginRequiredModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  loginRequiredModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginRequiredModalButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginRequiredModalButtonConfirm: {
    backgroundColor: '#D7E3A1',
  },
  loginRequiredModalButtonCancelText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#666666',
    fontWeight: 'bold',
  },
  loginRequiredModalButtonConfirmText: {
    fontSize: 16,
    fontFamily: 'Juache',
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

