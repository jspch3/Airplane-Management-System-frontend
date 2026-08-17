import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { User, LoginResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : 'https://ams-backend-production-f3ef.up.railway.app/api';

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('ams_user');
    if (saved) {
      try {
        this.currentUserSubject.next(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('ams_user');
      }
    }
  }

  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  registerUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, user);
  }

  registerAdmin(admin: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register-admin`, admin);
  }

  login(userName: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { userName, password }).pipe(
      tap((res: LoginResponse) => {
        localStorage.setItem('ams_user', JSON.stringify(res));
        this.currentUserSubject.next(res);
      })
    );
  }

  getMaskedPhone(identity: string): Observable<{ userName: string; maskedPhone: string }> {
    return this.http.post<{ userName: string; maskedPhone: string }>(`${this.apiUrl}/auth/forgot-password/mask-phone`, { identity });
  }

  verifyMobile(userName: string, mobileNumber: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password/verify-mobile`, { userName, mobileNumber });
  }

  resetPassword(userName: string, mobileNumber: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password/reset-password`, { userName, mobileNumber, newPassword });
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  updateProfile(userId: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, user).pipe(
      tap((updatedUser: User) => {
        const current = this.currentUserValue;
        if (current && current.userId === userId) {
          const newCurrent: LoginResponse = {
            ...current,
            userName: updatedUser.userName,
            customerCategory: updatedUser.customerCategory,
            emailId: updatedUser.emailId
          };
          localStorage.setItem('ams_user', JSON.stringify(newCurrent));
          this.currentUserSubject.next(newCurrent);
        }
      })
    );
  }

  getUserCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/users/count`).pipe(
      map((res: { count: number }) => res.count)
    );
  }

  logout(): void {
    localStorage.removeItem('ams_user');
    this.currentUserSubject.next(null);
  }
}
