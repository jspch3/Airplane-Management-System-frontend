import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CarrierService } from '../../services/carrier.service';
import { FlightService } from '../../services/flight.service';
import { BookingService } from '../../services/booking.service';
import { LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width: 1100px; margin: 0 auto;">
      <!-- Admin Welcome Banner -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; border-radius: 20px; color: #ffffff; margin-bottom: 28px; box-shadow: var(--shadow-xl); position: relative; overflow: hidden; border-left: 6px solid #06b6d4;">
        <div style="position: absolute; right: -20px; bottom: -30px; font-size: 10rem; opacity: 0.06; pointer-events: none;">⚙️</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="background: rgba(6, 182, 212, 0.25); color: #06b6d4; font-size: 0.8rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(6, 182, 212, 0.4); text-transform: uppercase;">
              Administrator Command Center
            </span>
            <h2 style="font-size: 1.85rem; font-weight: 900; margin: 10px 0 4px 0; color: #ffffff; letter-spacing: -0.02em;">
              System Control Dashboard
            </h2>
            <p style="color: #94a3b8; font-size: 0.95rem; margin: 0;">
              Manage airline carriers, flight routes, fare schedules, user accounts, and system-wide passenger bookings.
            </p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Logged in as</div>
            <span class="badge" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; font-size: 0.95rem; padding: 8px 18px; border-radius: 20px;">
              🛡️ {{ user?.userName || 'admin' }} (ADMIN)
            </span>
          </div>
        </div>
      </div>

      <!-- Key System Metrics Cards -->
      <div class="grid-4" style="margin-bottom: 32px;">
        <div class="card" style="margin: 0; padding: 22px; border-left: 4px solid var(--primary-blue);">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Registered Carriers</div>
          <div style="font-size: 2.2rem; font-weight: 900; color: var(--primary-navy); margin: 4px 0;">
            {{ totalCarriers }}
          </div>
          <a routerLink="/admin/carriers" style="font-size: 0.825rem; font-weight: 700; color: var(--primary-blue); text-decoration: none;">Manage Carriers &rarr;</a>
        </div>

        <div class="card" style="margin: 0; padding: 22px; border-left: 4px solid var(--info-sky);">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Active Flights</div>
          <div style="font-size: 2.2rem; font-weight: 900; color: var(--primary-navy); margin: 4px 0;">
            {{ totalFlights }}
          </div>
          <a routerLink="/flights" style="font-size: 0.825rem; font-weight: 700; color: var(--primary-blue); text-decoration: none;">View Flight Schedule &rarr;</a>
        </div>

        <div class="card" style="margin: 0; padding: 22px; border-left: 4px solid var(--accent-emerald);">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Total System Bookings</div>
          <div style="font-size: 2.2rem; font-weight: 900; color: var(--primary-navy); margin: 4px 0;">
            {{ totalBookings }}
          </div>
          <a routerLink="/bookings" style="font-size: 0.825rem; font-weight: 700; color: var(--accent-emerald); text-decoration: none;">View All Bookings &rarr;</a>
        </div>

        <div class="card" style="margin: 0; padding: 22px; border-left: 4px solid #8b5cf6;">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Registered Users</div>
          <div style="font-size: 2.2rem; font-weight: 900; color: #6d28d9; margin: 4px 0;">
            {{ totalUsers }}
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Active Accounts</span>
        </div>
      </div>

      <!-- Quick Action Panels for Admin -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary-navy);">⚙️ System Administration Actions</h3>
      </div>

      <div class="grid-3" style="margin-bottom: 32px;">
        <a routerLink="/admin/carriers" class="card" style="text-decoration: none; padding: 26px; transition: transform 0.2s ease; cursor: pointer; border: 1.5px solid var(--gray-200);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">⚙️</div>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">Carrier Management</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Register new airline carriers, configure tier discounts (Silver/Gold/Platinum), advance booking rules, and refund percentages.</p>
        </a>

        <a routerLink="/admin/flights/new" class="card" style="text-decoration: none; padding: 26px; transition: transform 0.2s ease; cursor: pointer; border: 1.5px solid var(--gray-200);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">➕</div>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">Register New Flight</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Configure origin departure cities, destination arrival cities, flight timings, and class fares (Economy, Business, Executive).</p>
        </a>

        <a routerLink="/bookings" class="card" style="text-decoration: none; padding: 26px; transition: transform 0.2s ease; cursor: pointer; border: 1.5px solid var(--gray-200);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">📋</div>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">All Customer Bookings</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Monitor system-wide flight reservations, view customer payment references, print e-tickets, and process partial cancellations.</p>
        </a>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  user: LoginResponse | null = null;
  totalCarriers = 0;
  totalFlights = 0;
  totalBookings = 0;
  totalUsers = 0;

  constructor(
    private authService: AuthService,
    private carrierService: CarrierService,
    private flightService: FlightService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
    });

    this.carrierService.getAllCarriers().subscribe(c => this.totalCarriers = c.length);
    this.flightService.getAllFlights().subscribe(f => this.totalFlights = f.length);
    this.bookingService.getAllBookings().subscribe(bList => this.totalBookings = bList.length);
    this.authService.getUserCount().subscribe(c => this.totalUsers = c);
  }
}
