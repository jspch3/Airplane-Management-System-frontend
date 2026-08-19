import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header style="background: linear-gradient(135deg, #0b1329 0%, #111c3a 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.1); position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(12px); box-shadow: 0 10px 25px -5px rgba(11, 19, 41, 0.5);">
      <div class="container" style="padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
        
        <!-- Brand Logo -->
        <a [routerLink]="user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/login'" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #0284c7, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
            ✈️
          </div>
          <div>
            <span style="font-size: 1.3rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">SkyRoute</span>
            <span style="font-size: 1.3rem; font-weight: 800; color: #06b6d4; letter-spacing: -0.02em;"> Enterprise</span>
          </div>
        </a>

        <!-- Navigation Links -->
        <nav style="display: flex; align-items: center; gap: 20px;">
          <ul style="display: flex; align-items: center; gap: 8px; list-style: none; margin: 0; padding: 0;">
            
            <li *ngIf="user">
              <a [routerLink]="user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                🏠 Dashboard
              </a>
            </li>

            <li *ngIf="user && user.role === 'ADMIN'">
              <a routerLink="/admin/carriers" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                ⚙️ Carriers
              </a>
            </li>

            <li *ngIf="user">
              <a routerLink="/flights" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                ✈️ Flights
              </a>
            </li>

            <li *ngIf="user && user.role === 'ADMIN'">
              <a routerLink="/admin/flights/new" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                ➕ Add Flight
              </a>
            </li>

            <li *ngIf="user && user.role === 'CUSTOMER'">
              <a routerLink="/book-flight" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                🎟️ Book Ticket
              </a>
            </li>

            <li *ngIf="user">
              <a routerLink="/bookings" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                📋 {{ user.role === 'ADMIN' ? 'All Bookings' : 'My Bookings' }}
              </a>
            </li>

            <!-- Profile Page Link (Strictly Customer Only - Admin profile links removed) -->
            <li *ngIf="user && user.role === 'CUSTOMER'">
              <a routerLink="/profile" routerLinkActive="active-nav" style="color: #94a3b8; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 14px; border-radius: 20px; transition: all 0.2s ease;">
                👤 Profile
              </a>
            </li>

            <!-- Auth Controls for Logged Out User -->
            <li *ngIf="!user">
              <a routerLink="/login" style="color: #ffffff; text-decoration: none; font-weight: 700; font-size: 0.875rem; padding: 8px 20px; border-radius: 30px; border: 1.5px solid rgba(255,255,255,0.2); transition: all 0.2s ease;">
                Sign In
              </a>
            </li>

            <li *ngIf="!user">
              <a routerLink="/register" class="btn btn-primary" style="padding: 8px 20px; font-size: 0.875rem;">
                Register Account
              </a>
            </li>

            <!-- Customer User Avatar Chip + Logout Button -->
            <li *ngIf="user && user.role === 'CUSTOMER'" style="display: flex; align-items: center; gap: 10px;">
              <a routerLink="/profile" style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.08); padding: 6px 14px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.15); text-decoration: none;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; color: #ffffff;">
                  {{ user.userName.substring(0, 1).toUpperCase() }}
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; line-height: 1.2;">{{ user.userName }}</span>
                  <span style="font-size: 0.7rem; font-weight: 800; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px;">
                    {{ user.customerCategory || 'MEMBER' }}
                  </span>
                </div>
              </a>
              <button (click)="logout()" class="btn btn-outline" style="border-color: #ef4444; color: #f87171; font-size: 0.85rem; padding: 6px 14px; font-weight: 700;">
                🚪 Logout
              </button>
            </li>

            <!-- Admin Menu: Strictly User Chip + Sign Out Only -->
            <li *ngIf="user && user.role === 'ADMIN'" style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; background: rgba(2, 132, 199, 0.2); padding: 6px 14px; border-radius: 30px; border: 1px solid rgba(2, 132, 199, 0.4);">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #0369a1); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; color: #ffffff;">
                  🛡️
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; line-height: 1.2;">{{ user.userName }}</span>
                  <span style="font-size: 0.7rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">SYSTEM ADMIN</span>
                </div>
              </div>

              <!-- Admin Menu Action: Strictly Sign Out -->
              <button (click)="logout()" class="btn btn-outline" style="border-color: #ef4444; color: #f87171; font-size: 0.85rem; padding: 6px 14px; font-weight: 700;">
                🚪 Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .active-nav {
      color: #ffffff !important;
      background: rgba(2, 132, 199, 0.25) !important;
      border: 1px solid rgba(2, 132, 199, 0.4) !important;
    }
  `]
})
export class NavbarComponent implements OnInit {
  user: LoginResponse | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
