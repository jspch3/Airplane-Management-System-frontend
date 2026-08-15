export interface Carrier {
  carrierId?: number;
  carrierName: string;
  discount30DaysAdvanceBooking: number;
  discount60DaysAdvanceBooking: number;
  discount90DaysAdvanceBooking: number;
  bulkBookingDiscount: number;
  silverUserDiscount: number;
  goldUserDiscount: number;
  platinumUserDiscount: number;
  refund2DaysBeforeTravelDate: number;
  refund10DaysBeforeTravelDate: number;
  refund20DaysOrMoreBeforeTravelDate: number;
}
