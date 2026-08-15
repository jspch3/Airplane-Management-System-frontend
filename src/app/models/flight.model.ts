export interface Flight {
  flightId?: number;
  carrierId: number;
  carrierName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airFare: number;
  economyClassFare: number;
  businessClassFare: number;
  executiveClassFare: number;
  seatCapacityBusinessClass: number;
  seatCapacityEconomyClass: number;
  seatCapacityExecutiveClass: number;
  bookedSeatsBusinessClass?: number;
  bookedSeatsEconomyClass?: number;
  bookedSeatsExecutiveClass?: number;
}
