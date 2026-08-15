import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';
import { Flight } from '../../models/flight.model';
import { LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 1100px; margin: 0 auto;">
      <div class="card">
        <div class="card-header-bar">
          <div>
            <div class="card-title">
              <span>✈️ Available Flights Search & Schedule [US005 / US006]</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              Browse available flight routes, departure/arrival timings, and seat class pricing in Indian Rupees (&#8377;).
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <!-- Total Flight Count Metric Badge -->
            <div class="badge" style="background: var(--info-sky); color: var(--info-text); padding: 10px 18px; font-size: 0.9rem; border-radius: 30px; border: 1px solid rgba(2, 132, 199, 0.2);">
              Total Registered Flights: <strong>{{ flights.length }}</strong>
            </div>
            <div *ngIf="user && user.role === 'ADMIN'">
              <a routerLink="/admin/flights/new" class="btn btn-primary" style="padding: 10px 18px; font-size: 0.9rem;">
                ➕ Register New Flight
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="actionMsg" class="alert alert-success">
          ✅ {{ actionMsg }}
        </div>

        <div *ngIf="actionError" class="alert alert-danger">
          ❌ {{ actionError }}
        </div>

        <!-- Carrier Search Filter -->
        <div class="form-group" style="max-width: 420px; margin-bottom: 24px;">
          <label class="form-label">🔍 Live Search by Carrier Name</label>
          <div style="display: flex; gap: 10px;">
            <input
              type="text"
              [(ngModel)]="searchCarrierName"
              (keyup.enter)="searchByCarrier()"
              class="form-control"
              placeholder="e.g. Indigo or Air India"
            />
            <button (click)="searchByCarrier()" class="btn btn-primary" style="padding: 10px 16px;">
              Search
            </button>
            <button (click)="resetSearch()" class="btn btn-outline" style="padding: 10px 14px;">
              Reset
            </button>
          </div>
        </div>

        <div *ngIf="isLoading" style="text-align: center; padding: 40px; color: var(--gray-600);">
          Loading available flight schedules...
        </div>

        <div *ngIf="!isLoading && flights.length === 0" class="alert alert-warning">
          No flights found matching your carrier search.
        </div>

        <!-- Flight Table -->
        <div *ngIf="!isLoading && flights.length > 0" class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Flight ID</th>
                <th>Carrier Name</th>
                <th>Route (Origin &rarr; Dest)</th>
                <th>Timings (Dep &rarr; Arr)</th>
                <th>Class Fares (&#8377; INR)</th>
                <th>Seat Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of flights">
                <td><strong>#AMS-{{ f.flightId }}</strong></td>
                <td>
                  <span style="font-weight: 800; color: var(--primary-navy);">{{ f.carrierName }}</span>
                </td>
                <td>
                  <div style="font-weight: 700;">{{ f.origin }} &rarr; {{ f.destination }}</div>
                </td>
                <td>
                  <div style="font-size: 0.85rem; color: var(--gray-800);">
                    🕒 Dep: <strong>{{ f.departureTime || '10:30 AM' }}</strong><br/>
                    🛬 Arr: <strong>{{ f.arrivalTime || '01:45 PM' }}</strong>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.825rem;">
                    <div>Economy: <strong style="color: var(--primary-blue);">&#8377;{{ f.economyClassFare || f.airFare }}</strong></div>
                    <div>Business: <strong style="color: var(--accent-gold);">&#8377;{{ f.businessClassFare || (f.airFare * 1.8) }}</strong></div>
                    <div>Executive: <strong style="color: #8b5cf6;">&#8377;{{ f.executiveClassFare || (f.airFare * 2.8) }}</strong></div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.8rem; color: var(--gray-600);">
                    <div>Economy: {{ (f.seatCapacityEconomyClass || 150) - (f.bookedSeatsEconomyClass || 0) }} seats</div>
                    <div>Business: {{ (f.seatCapacityBusinessClass || 30) - (f.bookedSeatsBusinessClass || 0) }} seats</div>
                    <div>Executive: {{ (f.seatCapacityExecutiveClass || 12) - (f.bookedSeatsExecutiveClass || 0) }} seats</div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 8px;">
                    <a
                      *ngIf="user && user.role === 'CUSTOMER'"
                      [routerLink]="['/book-flight']"
                      [queryParams]="{ flightId: f.flightId }"
                      class="btn btn-primary"
                      style="padding: 6px 12px; font-size: 0.825rem;"
                    >
                      🎟️ Book Ticket
                    </a>
                    <a
                      *ngIf="user && user.role === 'ADMIN'"
                      [routerLink]="['/admin/flights/edit', f.flightId]"
                      class="btn btn-outline"
                      style="padding: 6px 12px; font-size: 0.825rem;"
                    >
                      ✏️ Edit
                    </a>
                    <button
                      *ngIf="user && user.role === 'ADMIN'"
                      (click)="openDeleteModal(f)"
                      class="btn btn-danger"
                      style="padding: 6px 10px; font-size: 0.825rem;"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 24px;">
          <button type="button" (click)="goBack()" class="btn btn-secondary">
            &larr; Back to Previous Page
          </button>
        </div>
      </div>
    </div>

    <!-- Flight Deletion Confirmation Modal [US006] -->
    <div class="modal-backdrop" *ngIf="showDeleteModal && flightToDelete">
      <div class="modal-content" style="max-width: 580px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.3rem; font-weight: 800; color: #dc2626;">
            🗑️ Confirm Flight Deletion [US006]
          </h3>
          <button (click)="closeDeleteModal()" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <div class="alert alert-danger" style="margin-bottom: 20px;">
          <strong>Warning:</strong> You are about to permanently remove Flight <strong>#AMS-{{ flightToDelete.flightId }}</strong> from the schedule inventory.
        </div>

        <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="font-size: 0.9rem; margin-bottom: 6px;">Carrier: <strong>{{ flightToDelete.carrierName }}</strong></div>
          <div style="font-size: 0.9rem; margin-bottom: 6px;">Route: <strong>{{ flightToDelete.origin }} &rarr; {{ flightToDelete.destination }}</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Dep Time: {{ flightToDelete.departureTime }} | Arr Time: {{ flightToDelete.arrivalTime }}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button (click)="closeDeleteModal()" class="btn btn-outline">Cancel</button>
          <button (click)="executeDeleteFlight()" class="btn btn-danger" [disabled]="isDeleting">
            <span *ngIf="isDeleting">Deleting Flight...</span>
            <span *ngIf="!isDeleting">🗑️ Yes, Permanently Delete Flight</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class FlightListComponent implements OnInit {
  flights: Flight[] = [];
  searchCarrierName = '';
  isLoading = true;
  user: LoginResponse | null = null;
  actionMsg = '';
  actionError = '';

  showDeleteModal = false;
  flightToDelete: Flight | null = null;
  isDeleting = false;

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
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  searchByCarrier(): void {
    if (!this.searchCarrierName.trim()) {
      this.loadAllFlights();
      return;
    }
    this.isLoading = true;
    this.flightService.getFlightsByCarrierName(this.searchCarrierName.trim()).subscribe({
      next: (data: Flight[]) => {
        this.flights = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  resetSearch(): void {
    this.searchCarrierName = '';
    this.loadAllFlights();
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
        this.actionError = err.error?.message || `Failed to delete Flight #AMS-${id}.`;
        this.closeDeleteModal();
      }
    });
  }
}
