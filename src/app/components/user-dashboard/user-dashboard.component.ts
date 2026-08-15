import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { LoginResponse } from '../../models/user.model';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width: 1050px; margin: 0 auto;">
      <!-- Welcome Hero Banner -->
      <div style="background: linear-gradient(135deg, #0b1329 0%, #111c3a 100%); padding: 32px 36px; border-radius: 20px; color: #ffffff; margin-bottom: 28px; box-shadow: var(--shadow-xl); position: relative; overflow: hidden;">
        <div style="position: absolute; right: -20px; bottom: -30px; font-size: 10rem; opacity: 0.06; pointer-events: none;">✈️</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="background: rgba(6, 182, 212, 0.2); color: #06b6d4; font-size: 0.8rem; font-weight: 800; padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(6, 182, 212, 0.3); text-transform: uppercase;">
              Customer Portal
            </span>
            <h2 style="font-size: 1.85rem; font-weight: 900; margin: 10px 0 4px 0; color: #ffffff; letter-spacing: -0.02em;">
              Welcome back, {{ user?.userName }}! 👋
            </h2>
            <p style="color: #94a3b8; font-size: 0.95rem; margin: 0;">
              Manage your flight reservations, view tier discounts, and book new direct flights.
            </p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Membership Tier</div>
            <span class="badge" [ngClass]="{
              'badge-silver': user?.customerCategory === 'SILVER',
              'badge-gold': user?.customerCategory === 'GOLD',
              'badge-platinum': user?.customerCategory === 'PLATINUM',
              'badge-secondary': !user?.customerCategory || user?.customerCategory === 'REGULAR'
            }" style="font-size: 0.95rem; padding: 8px 18px; border-radius: 20px;">
              ⭐ {{ user?.customerCategory || 'REGULAR' }} MEMBER
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Cards -->
      <div class="grid-3" style="margin-bottom: 32px;">
        <div class="card" style="margin: 0; padding: 24px; border-left: 4px solid var(--primary-blue);">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Total Active Bookings</div>
          <div style="font-size: 2.2rem; font-weight: 900; color: var(--primary-navy); margin: 6px 0;">
            {{ activeBookingsCount }}
          </div>
          <a routerLink="/bookings" style="font-size: 0.85rem; font-weight: 700; color: var(--primary-blue); text-decoration: none;">View All Bookings &rarr;</a>
        </div>

        <div class="card" style="margin: 0; padding: 24px; border-left: 4px solid var(--accent-emerald);">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Tier Discount Perks</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-emerald); margin: 6px 0;">
            {{ getTierDiscountText() }}
          </div>
          <span style="font-size: 0.825rem; color: var(--text-muted);">Applied automatically on flight fares</span>
        </div>

        <div class="card" style="margin: 0; padding: 24px; border-left: 4px solid var(--primary-blue-hover);">
          <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">My Account Profile</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--primary-navy); margin: 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ user?.emailId || 'customer@ams.com' }}
          </div>
          <a routerLink="/profile" style="font-size: 0.85rem; font-weight: 700; color: var(--primary-blue); text-decoration: none;">Manage Profile & Settings &rarr;</a>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary-navy);">⚡ Quick Actions</h3>
      </div>

      <div class="grid-3" style="margin-bottom: 32px;">
        <a routerLink="/flights" class="card" style="text-decoration: none; padding: 24px; transition: transform 0.2s ease; cursor: pointer;">
          <div style="font-size: 2rem; margin-bottom: 12px;">🔍</div>
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">Search Flights</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Browse schedules, check seat availability & class fares in ₹ INR.</p>
        </a>

        <a routerLink="/book-flight" class="card" style="text-decoration: none; padding: 24px; transition: transform 0.2s ease; cursor: pointer;">
          <div style="font-size: 2rem; margin-bottom: 12px;">✈️</div>
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">Book a Flight</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Select travel dates, add passengers (&ge;18 yrs) & pay securely.</p>
        </a>

        <a routerLink="/profile" class="card" style="text-decoration: none; padding: 24px; transition: transform 0.2s ease; cursor: pointer;">
          <div style="font-size: 2rem; margin-bottom: 12px;">👤</div>
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 6px;">My Profile & Sign Out</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">Update email, contact phone, home address, or sign out securely.</p>
        </a>
      </div>
    </div>
  `
})
export class UserDashboardComponent implements OnInit {
  user: LoginResponse | null = null;
  activeBookingsCount = 0;

  constructor(
    private authService: AuthService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u?.userId) {
        this.bookingService.getBookingsByUser(u.userId).subscribe((bList: Booking[]) => {
          this.activeBookingsCount = bList.filter((b: Booking) => b.bookingStatus !== 'CANCELLED').length;
        });
      }
    });
  }

  getTierDiscountText(): string {
    const cat = this.user?.customerCategory?.toUpperCase();
    if (cat === 'SILVER') return '5% Off Base Fares';
    if (cat === 'GOLD') return '10% Off Base Fares';
    if (cat === 'PLATINUM') return '15% Off Base Fares';
    return 'Standard Rates';
  }
}
