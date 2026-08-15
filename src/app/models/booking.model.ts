export interface Passenger {
  passengerId: number;
  name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
  seatNumber?: string;
  status?: string;
}

export interface BookingRequest {
  userId: number;
  flightId: number;
  noOfSeats: number;
  seatCategory: string;
  dateOfTravel: string;
  passengers: Partial<Passenger>[];
  paymentMethod: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  upiId?: string;
}

export interface Booking {
  bookingId: number;
  userId: number;
  userName: string;
  flightId: number;
  flightName: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  noOfSeats: number;
  seatCategory: string;
  dateOfTravel: string;
  bookingStatus: string;
  grossAmount: number;
  advanceDiscountAmount: number;
  tierDiscountAmount: number;
  bulkDiscountAmount: number;
  bookingAmount: number;
  netPayableAmount: number;
  refundAmount: number;
  cancellationDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  passengers: Passenger[];
}
