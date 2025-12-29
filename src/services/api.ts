// API 기본 설정
// React Native에서는 localhost가 실제 기기에서 작동하지 않습니다.
// 실제 기기를 사용하는 경우 컴퓨터의 IP 주소를 사용해야 합니다.
// Windows: ipconfig 명령어로 확인, Mac/Linux: ifconfig 명령어로 확인
import { Platform } from 'react-native';

// TODO: 실제 기기를 사용하는 경우 아래 IP 주소를 컴퓨터의 실제 IP로 변경하세요
// 예: '192.168.55.206'
const DEV_IP = '192.168.55.206'; // 실제 기기 사용 시 컴퓨터의 IP 주소로 변경

// 백엔드 API 기본 URL (Spring Boot 기본 포트: 8080)
const getBackendApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // 실제 기기 사용 시 DEV_IP, 에뮬레이터 사용 시 10.0.2.2
      return `http://10.0.2.2:8080/api`;
    } else {
      // iOS 시뮬레이터는 localhost 사용 가능, 실제 기기는 DEV_IP 사용
      return `http://${DEV_IP}:8080/api`;
    }
  } else {
    return 'https://your-production-api.com/api'; // 프로덕션 환경
  }
};

const getApiBaseUrl = () => {
  if (__DEV__) {
    // 개발 환경
    // 실제 기기를 사용하는 경우 DEV_IP 사용
    // Android 에뮬레이터는 10.0.2.2 사용 가능
    
    if (Platform.OS === 'android') {
      // 실제 기기 사용 시 DEV_IP, 에뮬레이터 사용 시 10.0.2.2
      return `http://${DEV_IP}:3000/api`;
    } else {
      // iOS 시뮬레이터는 localhost 사용 가능, 실제 기기는 DEV_IP 사용
      return `http://${DEV_IP}:3000/api`;
    }
  } else {
    return 'https://your-production-api.com/api'; // 프로덕션 환경
  }
};

const API_BASE_URL = getApiBaseUrl();
const BACKEND_API_BASE_URL = getBackendApiBaseUrl();

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 항공권 검색 파라미터
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode?: string; // 선택사항
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currencyCode?: string;
  maxPrice: number; // 필수값
  max?: number;
  nonStop?: boolean;
}

// 항공권 정보 타입
export interface FlightOffer {
  type: string;
  id: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
    }>;
  }>;
  validatingAirlineCodes?: string[];
}

// 항공권 검색 응답 타입
export interface FlightSearchResponse {
  data: FlightOffer[];
  meta?: any;
  dictionaries?: any;
}

// 항공권 검색 API 호출
export async function searchFlights(params: FlightSearchParams): Promise<ApiResponse<FlightSearchResponse>> {
  try {
    // maxPrice는 필수값
    if (!params.maxPrice || params.maxPrice <= 0) {
      return {
        success: false,
        error: 'maxPrice가 필요합니다.',
        message: '최대 가격을 입력해주세요.',
      };
    }

    const queryParams = new URLSearchParams();
    queryParams.append('originLocationCode', params.originLocationCode);
    queryParams.append('departureDate', params.departureDate);
    queryParams.append('adults', params.adults.toString());
    queryParams.append('maxPrice', params.maxPrice.toString());

    if (params.returnDate) queryParams.append('returnDate', params.returnDate);
    if (params.children) queryParams.append('children', params.children.toString());
    if (params.infants) queryParams.append('infants', params.infants.toString());
    if (params.travelClass) queryParams.append('travelClass', params.travelClass);
    if (params.currencyCode) queryParams.append('currencyCode', params.currencyCode);
    if (params.max) queryParams.append('max', params.max.toString());
    if (params.nonStop !== undefined) queryParams.append('nonStop', params.nonStop.toString());

    // maxPrice가 필수이므로 항상 여러 목적지 검색 API 사용
    const endpoint = `${API_BASE_URL}/flights/offers/multiple?${queryParams.toString()}`;

    console.log('항공권 검색 API 호출:', endpoint);
    console.log('파라미터:', params);
    console.log('API Base URL:', API_BASE_URL);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      return {
        success: false,
        error: errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`,
        message: errorData.error?.detail || errorData.message || '항공권 검색 중 오류가 발생했습니다.',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    let errorMessage = '네트워크 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        errorMessage = `네트워크 연결에 실패했습니다.\n\n가능한 원인:\n1. 백엔드 서버가 실행 중인지 확인해주세요\n2. 실제 기기를 사용하는 경우 컴퓨터의 IP 주소를 확인해주세요\n3. 같은 Wi-Fi 네트워크에 연결되어 있는지 확인해주세요\n\n현재 API URL: ${API_BASE_URL}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    console.error('API 호출 오류:', error);
    console.error('API URL:', API_BASE_URL);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      message: errorMessage,
    };
  }
}

// 호텔 가격비교 파라미터
export interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

// 호텔 정보 타입
export interface HotelOffer {
  hotelId: string;
  hotelName: string;
  price: {
    currency: string;
    total: string;
  };
  rating?: number;
  address?: string;
}

// 호텔 검색 응답 타입
export interface HotelSearchResponse {
  data: HotelOffer[];
}

// 호텔 가격비교 API 호출
export async function searchHotels(params: HotelSearchParams): Promise<ApiResponse<HotelSearchResponse>> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('cityCode', params.cityCode);
    queryParams.append('checkInDate', params.checkInDate);
    queryParams.append('checkOutDate', params.checkOutDate);
    queryParams.append('adults', params.adults.toString());

    if (params.priceRange?.min) queryParams.append('minPrice', params.priceRange.min.toString());
    if (params.priceRange?.max) queryParams.append('maxPrice', params.priceRange.max.toString());

    const endpoint = `${API_BASE_URL}/hotels/offers?${queryParams.toString()}`;

    console.log('호텔 검색 API 호출:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      return {
        success: false,
        error: errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`,
        message: errorData.error?.detail || errorData.message || '호텔 검색 중 오류가 발생했습니다.',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('호텔 API 호출 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
    };
  }
}

// 환전 API 파라미터
export interface ExchangeParams {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

// 환전 정보 타입
export interface ExchangeInfo {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  exchangeRate: number;
  convertedAmount: number;
}

// 환전 API 호출
export async function getExchangeRate(params: ExchangeParams): Promise<ApiResponse<ExchangeInfo>> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('from', params.fromCurrency);
    queryParams.append('to', params.toCurrency);
    queryParams.append('amount', params.amount.toString());

    const endpoint = `${API_BASE_URL}/exchange?${queryParams.toString()}`;

    console.log('환전 API 호출:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      return {
        success: false,
        error: errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`,
        message: errorData.error?.detail || errorData.message || '환전 정보 조회 중 오류가 발생했습니다.',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('환전 API 호출 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      message: '네트워크 오류가 발생했습니다.',
    };
  }
}

// ========== 백엔드 통합 API ==========

// 백엔드 여행 검색 요청 파라미터
export interface TripSearchRequest {
  budgetWon: number; // 예산 (원 단위)
  people: number; // 인원수
  departDate: string; // 출발일 (YYYY-MM-DD)
  returnDate: string; // 귀국일 (YYYY-MM-DD)
  preferredRegion?: string; // 선호 지역 (선택사항)
}

// 백엔드 여행 검색 응답 타입
export interface TripSearchResponse {
  requested: TripSearchRequest;
  exchange: {
    base: string;
    rates: {
      JPY?: number;
      USD?: number;
    };
    updatedAt: string;
  };
  budget: {
    budgetWon: number;
    estimatedTotalWon: number;
    remainingWon: number;
  };
  flights: Array<{
    airline: string;
    priceWon: number;
    departureAirport: string;
    departureTime: string;
    arrivalAirport: string;
    arrivalTime: string;
    durationMinutes: number;
    stops: number;
    segments: Array<{
      flightNo: string;
      from: string;
      to: string;
      depTime: string;
      arrTime: string;
    }>;
  }>;
  hotels: any[]; // 호텔 데이터는 나중에 정의
}

// 백엔드 통합 여행 검색 API 호출
export async function searchTrip(params: TripSearchRequest): Promise<ApiResponse<TripSearchResponse>> {
  try {
    const endpoint = `${BACKEND_API_BASE_URL}/trips/search`;

    console.log('백엔드 여행 검색 API 호출:', endpoint);
    console.log('요청 파라미터:', params);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    console.log('API 응답 상태:', response.status, response.statusText);
    console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorData;
      try {
        const errorText = await response.text();
        console.error('백엔드 API 에러 응답:', errorText);
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      return {
        success: false,
        error: errorData.message || `HTTP error! status: ${response.status}`,
        message: errorData.message || '여행 검색 중 오류가 발생했습니다.',
      };
    }

    const responseText = await response.text();
    console.log('백엔드 API 원본 응답 텍스트:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      console.error('응답 텍스트:', responseText);
      return {
        success: false,
        error: '응답 파싱 오류',
        message: '백엔드 응답을 파싱할 수 없습니다.',
      };
    }
    
    console.log('백엔드 API 파싱된 응답:', JSON.stringify(data, null, 2));
    console.log('백엔드 API 응답 flights:', data.flights);
    console.log('백엔드 API 응답 flights 타입:', typeof data.flights);
    console.log('백엔드 API 응답 flights 배열 여부:', Array.isArray(data.flights));
    console.log('백엔드 API 응답 flights 개수:', data.flights?.length || 0);
    
    if (!data.flights || !Array.isArray(data.flights)) {
      console.warn('⚠️ 백엔드 응답에 flights 배열이 없거나 배열이 아닙니다!');
      console.warn('전체 응답:', JSON.stringify(data, null, 2));
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    let errorMessage = '네트워크 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('Network request failed')) {
        errorMessage = `네트워크 연결에 실패했습니다.\n\n가능한 원인:\n1. 백엔드 서버가 실행 중인지 확인해주세요\n2. 실제 기기를 사용하는 경우 컴퓨터의 IP 주소를 확인해주세요\n3. 같은 Wi-Fi 네트워크에 연결되어 있는지 확인해주세요\n\n현재 API URL: ${BACKEND_API_BASE_URL}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    console.error('백엔드 API 호출 오류:', error);
    console.error('API URL:', BACKEND_API_BASE_URL);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      message: errorMessage,
    };
  }
}
