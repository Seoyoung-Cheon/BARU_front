import type { FlightItem, HotelPrice, ExchangeAmount } from '../screens/ResultScreen';

export type RootStackParamList = {
  Intro: undefined;
  Home: undefined;
  Step1: undefined;
  Step2: {
    isDomestic?: boolean;
  };
  Result: {
    budget?: string;
    peopleCount?: string;
    departureDate?: Date;
    arrivalDate?: Date;
    isDomestic?: boolean;
    departureAirport?: string;
    returnAirport?: string;
    departureStation?: string;
    returnStation?: string;
    transportType?: 'train' | 'flight';
  };
  Detail: {
    flight: FlightItem;
    hotels: HotelPrice[];
    exchange?: ExchangeAmount;
    budget?: string;
    peopleCount?: string;
    departureDate?: Date;
    arrivalDate?: Date;
  };
  MyPage: undefined;
  Login: {
    redirectTo?: 'Detail';
    detailParams?: {
      flight: FlightItem;
      hotels: HotelPrice[];
      exchange?: ExchangeAmount;
      budget?: string;
      peopleCount?: string;
      departureDate?: Date;
      arrivalDate?: Date;
    };
  };
};


