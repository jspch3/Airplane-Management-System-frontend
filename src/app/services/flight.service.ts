import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight } from '../models/flight.model';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api/flights'
    : 'https://ams-backend-production-f3ef.up.railway.app/api/flights';

  constructor(private http: HttpClient) {}

  registerFlight(flight: Flight): Observable<Flight> {
    return this.http.post<Flight>(this.apiUrl, flight);
  }

  updateFlight(flightId: number, flight: Flight): Observable<Flight> {
    return this.http.put<Flight>(`${this.apiUrl}/${flightId}`, flight);
  }

  getAllFlights(carrierName?: string): Observable<Flight[]> {
    let url = this.apiUrl;
    if (carrierName && carrierName.trim()) {
      url += `?carrierName=${encodeURIComponent(carrierName.trim())}`;
    }
    return this.http.get<Flight[]>(url);
  }

  getFlightsByCarrierName(carrierName: string): Observable<Flight[]> {
    return this.getAllFlights(carrierName);
  }

  getFlightById(flightId: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/${flightId}`);
  }

  deleteFlight(flightId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${flightId}`);
  }
}
