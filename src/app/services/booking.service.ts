import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingRequest } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api/bookings'
    : 'https://ams-backend-production-f3ef.up.railway.app/api/bookings';

  constructor(private http: HttpClient) {}

  bookFlight(bookingRequest: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, bookingRequest);
  }

  getAllBookings(userId?: number): Observable<Booking[]> {
    let url = this.apiUrl;
    if (userId) {
      url += `?userId=${userId}`;
    }
    return this.http.get<Booking[]>(url);
  }

  getBookingsByUser(userId: number): Observable<Booking[]> {
    return this.getAllBookings(userId);
  }

  getBookingById(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${bookingId}`);
  }

  cancelPartialOrFull(bookingId: number, passengerIds: number[]): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${bookingId}/cancel`, { passengerIds });
  }

  cancelPartialBooking(bookingId: number, passengerIds: number[]): Observable<Booking> {
    return this.cancelPartialOrFull(bookingId, passengerIds);
  }
}
