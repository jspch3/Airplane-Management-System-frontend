import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';
import { Flight } from '../../models/flight.model';
import { LoginResponse } from '../../models/user.model';
import { MAJOR_AIRPORTS } from '../../constants/location.data';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 1220px; margin: 0 auto; padding: 12px 0;">
      <div class="card" style="padding: 44px; border-radius: 24px;">
        <!-- Header Bar with Generous Spacing -->
        <div style="margin-bottom: 32px; border-bottom: 1.5px solid var(--gray-200); padding-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <div class="card-title" style="font-size: 1.7rem; margin-bottom: 8px;">
              <span>✈️ Available Flights Search & Schedule</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              Browse available flight routes, departure/arrival timings, and seat class pricing in Indian Rupees (&#8377;).
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div class="badge" style="background: var(--info-sky); color: var(--info-text); padding: 12px 20px; font-size: 0.925rem; border-radius: 30px; border: 1.5px solid rgba(2, 132, 199, 0.25);">
              Total Registered Flights: <strong>{{ filteredFlights.length }}</strong>
            </div>
            <div *ngIf="user && user.role === 'ADMIN'">
              <a routerLink="/admin/flights/new" class="btn btn-primary" style="padding: 12px 24px; font-size: 0.95rem; font-weight: 800;">
                ➕ Register New Flight
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="actionMsg" class="alert alert-success" style="margin-bottom: 32px;">
          ✅ {{ actionMsg }}
        </div>

        <div *ngIf="actionError" class="alert alert-danger" style="font-weight: 800; font-size: 1rem; padding: 20px; margin-bottom: 32px;">
          ❌ {{ actionError }}
        </div>

        <!-- Spacious Dedicated Filter Container Card -->
        <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 32px; border-radius: 20px; margin-bottom: 40px; box-shadow: var(--shadow-sm);">
          <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.1rem; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            🔍 Filter Flight Schedule by Carrier, Travel Date & Route Cities
          </div>

          <div class="grid-4" style="gap: 24px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Live Search by Carrier</label>
              <input
                type="text"
                [(ngModel)]="searchCarrierName"
                (input)="applyFilters()"
                class="form-control"
                placeholder="e.g. Indigo or Air India"
              />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Exact Travel Date</label>
              <input
                type="date"
                [(ngModel)]="searchScheduleDate"
                (change)="applyFilters()"
                class="form-control"
              />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Filter Origin City</label>
              <select [(ngModel)]="searchOrigin" (change)="applyFilters()" class="form-select">
                <option value="">All Origins</option>
                <option *ngFor="let apt of majorAirports" [value]="apt">{{ apt }}</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Filter Destination City</label>
              <select [(ngModel)]="searchDestination" (change)="applyFilters()" class="form-select">
                <option value="">All Destinations</option>
                <option *ngFor="let apt of majorAirports" [value]="apt">{{ apt }}</option>
              </select>
            </div>
          </div>
        </div>

        <div *ngIf="isLoading" style="text-align: center; padding: 48px; color: var(--gray-600); font-weight: 700; font-size: 1.05rem;">
          Loading available flight schedules...
        </div>

        <div *ngIf="!isLoading && filteredFlights.length === 0" class="alert alert-warning" style="margin-bottom: 36px;">
          No flights found matching your search filters.
        </div>

        <!-- Flight Table with Spacious Cell Padding -->
        <div *ngIf="!isLoading && filteredFlights.length > 0" class="table-responsive" style="margin-bottom: 40px;">
          <table class="table">
            <thead>
              <tr>
                <th>Flight ID</th>
                <th>Carrier Name</th>
                <th>Route (Origin &rarr; Dest)</th>
                <th>Schedule Date & Timings</th>
                <th>Class Fares (&#8377; INR)</th>
                <th>Seat Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of filteredFlights">
                <td><strong>#AMS-{{ f.flightId }}</strong></td>
                <td>
                  <span style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem;">{{ f.carrierName }}</span>
                </td>
                <td>
                  <div style="font-weight: 700; color: var(--primary-blue); font-size: 1rem;">{{ f.origin }} &rarr; {{ f.destination }}</div>
                </td>
                <td>
                  <div style="font-size: 0.875rem; color: var(--gray-800); display: flex; flex-direction: column; gap: 4px;">
                    <div>📅 Date: <strong>{{ f.scheduleDate || 'Daily' }}</strong></div>
                    <div style="color: #0284c7; font-weight: 700;">
                      🕒 Dep: {{ f.departureTime || '10:30 AM' }} &nbsp;|&nbsp; 🛬 Arr: {{ f.arrivalTime || '01:45 PM' }}
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px;">
                    <div>Economy: <strong style="color: var(--primary-blue);">&#8377;{{ f.economyClassFare || f.airFare }}</strong></div>
                    <div>Business: <strong style="color: var(--accent-gold);">&#8377;{{ f.businessClassFare || (f.airFare * 1.8) }}</strong></div>
                    <div>Executive: <strong style="color: #8b5cf6;">&#8377;{{ f.executiveClassFare || (f.airFare * 2.8) }}</strong></div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.825rem; color: var(--gray-600); display: flex; flex-direction: column; gap: 4px;">
                    <div>Economy: <strong>{{ (f.seatCapacityEconomyClass || 150) - (f.bookedSeatsEconomyClass || 0) }}</strong> seats left</div>
                    <div>Business: <strong>{{ (f.seatCapacityBusinessClass || 30) - (f.bookedSeatsBusinessClass || 0) }}</strong> seats left</div>
                    <div>Executive: <strong>{{ (f.seatCapacityExecutiveClass || 12) - (f.bookedSeatsExecutiveClass || 0) }}</strong> seats left</div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a
                      *ngIf="user && user.role === 'CUSTOMER'"
                      [routerLink]="['/book-flight']"
                      [queryParams]="{ flightId: f.flightId, date: f.scheduleDate }"
                      class="btn btn-primary btn-sm"
                      style="padding: 8px 16px; font-weight: 800;"
                    >
                      🎟️ Book Ticket
                    </a>
                    <a
                      *ngIf="user && user.role === 'ADMIN'"
                      [routerLink]="['/admin/flights/edit', f.flightId]"
                      class="btn btn-secondary btn-sm"
                      style="padding: 8px 14px;"
                    >
                      ✏️ Edit
                    </a>
                    <button
                      *ngIf="user && user.role === 'ADMIN'"
                      (click)="openDeleteModal(f)"
                      class="btn btn-danger btn-sm"
                      style="padding: 8px 14px;"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 36px; border-top: 1.5px solid var(--gray-200); padding-top: 24px;">
          <button type="button" (click)="goBack()" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
            &larr; Back to Previous Page
          </button>
        </div>
      </div>
    </div>

    <!-- Flight Deletion Confirmation Modal -->
    <div class="modal-backdrop" *ngIf="showDeleteModal && flightToDelete">
      <div class="modal-content" style="max-width: 600px; padding: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h3 style="font-size: 1.4rem; font-weight: 900; color: #dc2626;">
            🗑️ Confirm Flight Deletion
          </h3>
          <button (click)="closeDeleteModal()" class="btn btn-outline" style="padding: 4px 10px; font-size: 1.1rem;">✕</button>
        </div>

        <div class="alert alert-danger" style="margin-bottom: 24px;">
          <strong>Warning:</strong> You are about to remove Flight <strong>#AMS-{{ flightToDelete.flightId }}</strong> from system inventory.
        </div>

        <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 16px; padding: 24px; margin-bottom: 32px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.95rem;">Carrier: <strong>{{ flightToDelete.carrierName }}</strong></div>
          <div style="font-size: 0.95rem;">Route: <strong>{{ flightToDelete.origin }} &rarr; {{ flightToDelete.destination }}</strong></div>
          <div style="font-size: 0.875rem; color: var(--text-muted);">Schedule: {{ flightToDelete.scheduleDate || 'Daily' }} | Dep: {{ flightToDelete.departureTime }}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 16px;">
          <button (click)="closeDeleteModal()" class="btn btn-secondary">Cancel</button>
          <button (click)="executeDeleteFlight()" class="btn btn-danger" [disabled]="isDeleting" style="padding: 12px 24px; font-weight: 800;">
            <span *ngIf="isDeleting">Deleting Flight...</span>
            <span *ngIf="!isDeleting">🗑️ Yes, Delete Flight</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class FlightListComponent implements OnInit {
  flights: Flight[] = [];
  filteredFlights: Flight[] = [];

  searchCarrierName = '';
  searchScheduleDate = '';
  searchOrigin = '';
  searchDestination = '';

  isLoading = true;
  user: LoginResponse | null = null;
  actionMsg = '';
  actionError = '';

  showDeleteModal = false;
  flightToDelete: Flight | null = null;
  isDeleting = false;

  majorAirports = MAJOR_AIRPORTS;

  constructor(
    private flightService: FlightService,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.user = u);
    this.loadAllFlights();
  }

  goBack(): void {
    this.location.back();
  }

  loadAllFlights(): void {
    this.isLoading = true;
    this.flightService.getAllFlights().subscribe({
      next: (data: Flight[]) => {
        this.flights = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  applyFilters(): void {
    this.filteredFlights = this.flights.filter(f => {
      const matchCarrier = !this.searchCarrierName.trim() ||
        f.carrierName.toLowerCase().includes(this.searchCarrierName.trim().toLowerCase());

      const matchDate = !this.searchScheduleDate || f.scheduleDate === this.searchScheduleDate;
      const matchOrigin = !this.searchOrigin || f.origin === this.searchOrigin;
      const matchDest = !this.searchDestination || f.destination === this.searchDestination;

      return matchCarrier && matchDate && matchOrigin && matchDest;
    });
  }

  openDeleteModal(flight: Flight): void {
    this.flightToDelete = flight;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.flightToDelete = null;
  }

  executeDeleteFlight(): void {
    if (!this.flightToDelete?.flightId) return;

    this.actionMsg = '';
    this.actionError = '';
    this.isDeleting = true;

    const id = this.flightToDelete.flightId;

    this.flightService.deleteFlight(id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.actionMsg = `Flight #AMS-${id} deleted permanently from system inventory.`;
        this.closeDeleteModal();
        this.loadAllFlights();
      },
      error: (err: any) => {
        this.isDeleting = false;
        const msg = err.error?.message || err.message || '';
        if (msg.includes("active users") || msg.includes("active") || msg.includes("500") || msg.includes("Internal")) {
          this.actionError = "We can't delete the flight, it has active users.";
        } else {
          this.actionError = msg || "We can't delete the flight, it has active users.";
        }
        this.closeDeleteModal();
      }
    });
  }
}
