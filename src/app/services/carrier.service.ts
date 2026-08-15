import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Carrier } from '../models/carrier.model';

@Injectable({
  providedIn: 'root'
})
export class CarrierService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api/carriers'
    : 'https://ams-backend-production-f3ef.up.railway.app/api/carriers';

  constructor(private http: HttpClient) {}

  registerCarrier(carrier: Carrier): Observable<Carrier> {
    return this.http.post<Carrier>(this.apiUrl, carrier);
  }

  updateCarrier(carrierId: number, carrier: Carrier): Observable<Carrier> {
    return this.http.put<Carrier>(`${this.apiUrl}/${carrierId}`, carrier);
  }

  getAllCarriers(): Observable<Carrier[]> {
    return this.http.get<Carrier[]>(this.apiUrl);
  }

  getCarrierById(carrierId: number): Observable<Carrier> {
    return this.http.get<Carrier>(`${this.apiUrl}/${carrierId}`);
  }
}
