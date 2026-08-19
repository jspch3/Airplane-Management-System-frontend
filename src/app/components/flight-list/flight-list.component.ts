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

          <div class="grid-4" style="gap: 24px; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="min-height: 26px; display: flex; align-items: flex-end;">Filter by Carrier</label>
              <select [(ngModel)]="searchCarrierName" (change)="onCarrierFilterChanged()" class="form-select">
                <option value="">All Available Carriers</option>
                <option *ngFor="let c of availableCarriers" [value]="c">
                  🏢 {{ c }}
                </option>
              </select>
            </div>

            <!-- Requirement 2: Strict 3-Month Date Window Filter -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="min-height: 26px; display: flex; align-items: flex-end;">Travel Date (3-Month Window)</label>
              <input
                type="date"
                [(ngModel)]="searchScheduleDate"
                [min]="minSearchDate"
                [max]="maxSearchDate"
                (change)="onDateFilterChanged()"
                class="form-control"
              />
            </div>

            <!-- Requirement 3: Mutual Exclusion for Origin City -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="min-height: 26px; display: flex; align-items: flex-end;">Filter Origin City</label>
              <select [(ngModel)]="searchOrigin" (change)="onOriginFilterChanged()" class="form-select">
                <option value="">All Available Origins</option>
                <option *ngFor="let apt of availableOrigins" [value]="apt" [disabled]="apt === searchDestination">
                  🛫 {{ apt }} {{ apt === searchDestination ? '(Selected in Destination)' : '' }}
                </option>
              </select>
            </div>

            <!-- Requirement 3: Mutual Exclusion for Destination City -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="min-height: 26px; display: flex; align-items: flex-end;">Filter Destination City</label>
              <select [(ngModel)]="searchDestination" (change)="onDestinationFilterChanged()" class="form-select">
                <option value="">All Available Destinations</option>
                <option *ngFor="let apt of availableDestinations" [value]="apt" [disabled]="apt === searchOrigin">
                  🛬 {{ apt }} {{ apt === searchOrigin ? '(Selected in Origin)' : '' }}
                </option>
              </select>
            </div>
          </div>

          <!-- Quick Operating Date Pill Badges for Selected Carrier & Route -->
          <div *ngIf="availableFilterDates.length > 0" style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--gray-300); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 800; color: #0369a1;">⚡ Carrier Operating Dates:</span>
            <button
              type="button"
              *ngFor="let dt of availableFilterDates"
              (click)="setSearchDate(dt)"
              class="btn"
              [ngClass]="searchScheduleDate === dt ? 'btn-primary' : 'btn-secondary'"
              style="padding: 4px 12px; font-size: 0.8rem; font-weight: 700; border-radius: 14px;"
            >
              📅 {{ dt }}
            </button>
            <button
              type="button"
              *ngIf="searchScheduleDate"
              (click)="clearSearchDate()"
              class="btn btn-outline"
              style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700; border-radius: 14px; border-color: #ef4444; color: #ef4444;"
            >
              ✕ Clear Date
            </button>
          </div>
        </div>

        <div *ngIf="isLoading" style="text-align: center; padding: 48px; color: var(--gray-600); font-weight: 700; font-size: 1.05rem;">
          Loading available flight schedules...
        </div>

        <div *ngIf="!isLoading && filteredFlights.length === 0" class="alert alert-warning" style="margin-bottom: 36px;">
          No flights found matching your search filters.
        </div>

        <!-- Flight Table -->
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
                    <div>
                      📅 {{ searchScheduleDate ? 'Operating Date:' : 'Schedule Date:' }} <strong>{{ getDisplayDateForFlight(f) }}</strong>
                      <span *ngIf="searchScheduleDate && f.flightFrequency && f.flightFrequency !== 'SINGLE_DATE'" style="font-size: 0.75rem; color: #0284c7; font-weight: 700; margin-left: 4px;">
                        (Base: {{ f.scheduleDate }})
                      </span>
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 800; color: #475569;">
                      {{ getFrequencyLabel(f.flightFrequency) }}
                    </div>
                    <div style="color: #0284c7; font-weight: 700;">
                      🕒 Dep: {{ f.departureTime || '10:30 AM' }} &nbsp;|&nbsp; 🛬 Arr: {{ getFormattedArrivalTime(f) }}
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
                    <div>Economy: <strong>{{ f.seatCapacityEconomyClass || 150 }}</strong> seats/date</div>
                    <div>Business: <strong>{{ f.seatCapacityBusinessClass || 30 }}</strong> seats/date</div>
                    <div>Executive: <strong>{{ f.seatCapacityExecutiveClass || 12 }}</strong> seats/date</div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <!-- Requirement 1: Customer Book Option - Hidden if flight time has passed -->
                    <a
                      *ngIf="user && user.role === 'CUSTOMER' && !isFlightPassed(f)"
                      [routerLink]="['/book-flight']"
                      [queryParams]="{ flightId: f.flightId, date: getDisplayDateForFlight(f) }"
                      class="btn btn-primary btn-sm"
                      style="padding: 8px 16px; font-weight: 800;"
                    >
                      🎟️ Book Ticket
                    </a>

                    <span
                      *ngIf="user && user.role === 'CUSTOMER' && isFlightPassed(f)"
                      class="badge"
                      style="background: #f1f5f9; color: #64748b; font-weight: 700; border: 1.5px solid #cbd5e1; font-size: 0.8rem;"
                    >
                      ✈️ Departed / Boarded
                    </span>

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

  minSearchDate = '';
  maxSearchDate = '';

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
  ) {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    this.minSearchDate = today.toISOString().split('T')[0];
    this.maxSearchDate = threeMonthsLater.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.user = u);
    this.loadAllFlights();
  }

  goBack(): void {
    this.location.back();
  }

  getFrequencyLabel(freq?: string): string {
    if (freq === 'DAILY') return '🗓️ Daily (Every Day)';
    if (freq === 'EVERY_3_DAYS') return '🗓️ Every 3 Days';
    if (freq === 'WEEKLY') return '🗓️ Weekly (Every Week)';
    if (freq === 'MONTHLY') return '🗓️ Monthly (Every Month)';
    return '📅 Single Date Only';
  }

  normalizeCity(city?: string): string {
    if (!city) return '';
    let clean = city.replaceAll(/\s*\([^)]*\)/g, '').trim().toUpperCase();
    if (clean === 'HYD' || clean === 'HYDERABAD') return 'HYDERABAD';
    if (clean === 'VIJ' || clean === 'VGA' || clean === 'VIJAYAWADA') return 'VIJAYAWADA';
    if (clean === 'VTZ' || clean === 'VISAKHAPATNAM' || clean === 'VIZAG') return 'VISAKHAPATNAM';
    if (clean === 'BOM' || clean === 'MUMBAI') return 'MUMBAI';
    if (clean === 'DEL' || clean === 'DELHI') return 'DELHI';
    if (clean === 'BLR' || clean === 'BENGALURU' || clean === 'BANGALORE') return 'BENGALURU';
    if (clean === 'MAA' || clean === 'CHENNAI') return 'CHENNAI';
    if (clean === 'CCU' || clean === 'KOLKATA') return 'KOLKATA';
    return clean;
  }

  isFlightPassed(f: Flight, targetDateStr?: string): boolean {
    if (!f) return false;
    const effectiveDateStr = targetDateStr || this.searchScheduleDate || f.scheduleDate;
    if (!effectiveDateStr) return false;

    const freq = f.flightFrequency || 'SINGLE_DATE';

    try {
      const dateParts = effectiveDateStr.split('-').map(Number);
      if (dateParts.length !== 3) return false;

      let depTimeStr = f.departureTime || '10:30 AM';
      let depP = 'AM';
      if (depTimeStr.includes('PM')) { depP = 'PM'; depTimeStr = depTimeStr.replace('PM', '').trim(); }
      else if (depTimeStr.includes('AM')) { depP = 'AM'; depTimeStr = depTimeStr.replace('AM', '').trim(); }

      const parts = depTimeStr.split(':');
      let hours = parseInt(parts[0], 10);
      let minutes = parseInt(parts[1], 10);
      if (isNaN(hours)) hours = 10;
      if (isNaN(minutes)) minutes = 30;

      if (depP === 'PM' && hours < 12) hours += 12;
      if (depP === 'AM' && hours === 12) hours = 0;

      const flightDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes);
      const now = new Date();

      const targetDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (targetDateObj > todayDateObj) {
        return false; // Future date is valid!
      }

      if (targetDateObj < todayDateObj) {
        // If recurring, future dates exist; only this past date passed
        return freq === 'SINGLE_DATE';
      }

      // Today: check if departure time is within 30 minutes or passed (30-min buffer)
      const thirtyMinsLater = new Date(now.getTime() + 30 * 60 * 1000);
      const isPassedToday = thirtyMinsLater >= flightDateTime;

      // If single date flight and passed today, return true
      if (freq === 'SINGLE_DATE') {
        return isPassedToday;
      }

      // For recurring flight: today's departure passed, but future dates exist!
      // If user is searching specifically for today, return isPassedToday
      if (this.searchScheduleDate) {
        return isPassedToday;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  availableCarriers: string[] = [];
  availableOrigins: string[] = [];
  availableDestinations: string[] = [];
  availableFilterDates: string[] = [];

  onCarrierFilterChanged(): void {
    this.applyFilters();
  }

  onDateFilterChanged(): void {
    this.applyFilters();
  }

  onOriginFilterChanged(): void {
    this.applyFilters();
  }

  onDestinationFilterChanged(): void {
    this.applyFilters();
  }

  setSearchDate(dt: string): void {
    this.searchScheduleDate = dt;
    this.applyFilters();
  }

  clearSearchDate(): void {
    this.searchScheduleDate = '';
    this.applyFilters();
  }

  updateCascadingFilterOptions(): void {
    // 1. Available Carriers: Flights matching Date, Origin, Destination
    const carriersSet = new Set<string>();
    this.flights.forEach(f => {
      if (this.user && this.user.role === 'CUSTOMER' && this.isFlightPassed(f)) return;

      const matchDate = !this.searchScheduleDate || this.isFlightOperatingOnDate(f, this.searchScheduleDate);
      const matchOrigin = !this.searchOrigin || this.normalizeCity(f.origin) === this.normalizeCity(this.searchOrigin);
      const matchDest = !this.searchDestination || this.normalizeCity(f.destination) === this.normalizeCity(this.searchDestination);

      if (matchDate && matchOrigin && matchDest && f.carrierName) {
        carriersSet.add(f.carrierName);
      }
    });
    this.availableCarriers = Array.from(carriersSet).sort();

    // 2. Available Origins: Flights matching Carrier, Date, Destination
    const originsSet = new Set<string>();
    this.flights.forEach(f => {
      if (this.user && this.user.role === 'CUSTOMER' && this.isFlightPassed(f)) return;

      const matchCarrier = !this.searchCarrierName || f.carrierName === this.searchCarrierName;
      const matchDate = !this.searchScheduleDate || this.isFlightOperatingOnDate(f, this.searchScheduleDate);
      const matchDest = !this.searchDestination || this.normalizeCity(f.destination) === this.normalizeCity(this.searchDestination);

      if (matchCarrier && matchDate && matchDest && f.origin) {
        originsSet.add(f.origin);
      }
    });
    this.availableOrigins = Array.from(originsSet).sort();

    // 3. Available Destinations: Flights matching Carrier, Date, Origin
    const destsSet = new Set<string>();
    this.flights.forEach(f => {
      if (this.user && this.user.role === 'CUSTOMER' && this.isFlightPassed(f)) return;

      const matchCarrier = !this.searchCarrierName || f.carrierName === this.searchCarrierName;
      const matchDate = !this.searchScheduleDate || this.isFlightOperatingOnDate(f, this.searchScheduleDate);
      const matchOrigin = !this.searchOrigin || this.normalizeCity(f.origin) === this.normalizeCity(this.searchOrigin);

      if (matchCarrier && matchDate && matchOrigin && f.destination) {
        destsSet.add(f.destination);
      }
    });
    this.availableDestinations = Array.from(destsSet).sort();

    // 4. Calculate available operating dates for current selected carrier/origin/dest
    this.computeAvailableFilterDates();
  }

  computeAvailableFilterDates(): void {
    const matchingFlights = this.flights.filter(f => {
      const matchCarrier = !this.searchCarrierName || f.carrierName === this.searchCarrierName;
      const matchOrigin = !this.searchOrigin || this.normalizeCity(f.origin) === this.normalizeCity(this.searchOrigin);
      const matchDest = !this.searchDestination || this.normalizeCity(f.destination) === this.normalizeCity(this.searchDestination);
      return matchCarrier && matchOrigin && matchDest;
    });

    const datesSet = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeMonths = new Date();
    threeMonths.setMonth(today.getMonth() + 3);

    matchingFlights.forEach(f => {
      const startStr = f.scheduleDate || today.toISOString().split('T')[0];
      const freq = f.flightFrequency || 'SINGLE_DATE';
      const startParts = startStr.split('-').map(Number);
      let curr = new Date(startParts[0], startParts[1] - 1, startParts[2]);

      while (curr <= threeMonths) {
        if (curr >= today) {
          const iso = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
          if (this.isFlightOperatingOnDate(f, iso) && (!this.user || this.user.role !== 'CUSTOMER' || !this.isFlightPassed(f, iso))) {
            datesSet.add(iso);
          }
        }
        if (freq === 'DAILY') curr.setDate(curr.getDate() + 1);
        else if (freq === 'EVERY_3_DAYS') curr.setDate(curr.getDate() + 3);
        else if (freq === 'WEEKLY') curr.setDate(curr.getDate() + 7);
        else if (freq === 'MONTHLY') curr.setMonth(curr.getMonth() + 1);
        else break;

        if (datesSet.size >= 12) break;
      }
    });

    this.availableFilterDates = Array.from(datesSet).sort().slice(0, 8);
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
    this.updateCascadingFilterOptions();

    // Auto-reset invalid choices if selection is no longer available in cascade
    if (this.searchCarrierName && !this.availableCarriers.includes(this.searchCarrierName)) {
      this.searchCarrierName = '';
    }
    if (this.searchOrigin && !this.availableOrigins.includes(this.searchOrigin)) {
      this.searchOrigin = '';
    }
    if (this.searchDestination && !this.availableDestinations.includes(this.searchDestination)) {
      this.searchDestination = '';
    }

    this.filteredFlights = this.flights.filter(f => {
      // Exclude passed flights for CUSTOMERS
      if (this.user && this.user.role === 'CUSTOMER' && this.isFlightPassed(f)) {
        return false;
      }

      const matchCarrier = !this.searchCarrierName || f.carrierName === this.searchCarrierName;
      const matchDate = !this.searchScheduleDate || this.isFlightOperatingOnDate(f, this.searchScheduleDate);
      const matchOrigin = !this.searchOrigin || this.normalizeCity(f.origin) === this.normalizeCity(this.searchOrigin);
      const matchDest = !this.searchDestination || this.normalizeCity(f.destination) === this.normalizeCity(this.searchDestination);

      return matchCarrier && matchDate && matchOrigin && matchDest;
    });
  }

  getFormattedArrivalTime(f: Flight): string {
    if (!f.arrivalTime || f.arrivalTime.includes('+') || f.arrivalTime.toLowerCase().includes('2h')) {
      const depStr = f.departureTime || '10:30 AM';
      let depP = 'AM';
      let cleanDep = depStr;
      if (cleanDep.includes('PM')) { depP = 'PM'; cleanDep = cleanDep.replace('PM', '').trim(); }
      else if (cleanDep.includes('AM')) { depP = 'AM'; cleanDep = cleanDep.replace('AM', '').trim(); }

      const parts = cleanDep.split(':');
      let h = parseInt(parts[0], 10) || 10;
      let m = parseInt(parts[1], 10) || 30;

      if (depP === 'PM' && h < 12) h += 12;
      if (depP === 'AM' && h === 12) h = 0;

      let durMins = 120;
      const oClean = this.normalizeCity(f.origin);
      const dClean = this.normalizeCity(f.destination);

      if ((oClean === 'MUMBAI' && dClean === 'DELHI') || (oClean === 'DELHI' && dClean === 'MUMBAI')) durMins = 135;
      else if ((oClean === 'MUMBAI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'MUMBAI')) durMins = 105;
      else if ((oClean === 'MUMBAI' && dClean === 'HYDERABAD') || (oClean === 'HYDERABAD' && dClean === 'MUMBAI')) durMins = 85;
      else if ((oClean === 'MUMBAI' && dClean === 'DUBAI') || (oClean === 'DUBAI' && dClean === 'MUMBAI')) durMins = 210;
      else if ((oClean === 'DELHI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'DELHI')) durMins = 170;
      else if ((oClean === 'VIJAYAWADA' && dClean === 'VISAKHAPATNAM') || (oClean === 'VISAKHAPATNAM' && dClean === 'VIJAYAWADA')) durMins = 60;
      else if ((oClean === 'HYDERABAD' && dClean === 'VIJAYAWADA') || (oClean === 'VIJAYAWADA' && dClean === 'HYDERABAD')) durMins = 60;

      let totalMins = (h * 60) + m + durMins;
      totalMins = totalMins % (24 * 60);

      let arrHours24 = Math.floor(totalMins / 60);
      let arrMins = totalMins % 60;

      let arrPeriod = arrHours24 >= 12 ? 'PM' : 'AM';
      let arrHours12 = arrHours24 % 12;
      if (arrHours12 === 0) arrHours12 = 12;

      return `${arrHours12.toString().padStart(2, '0')}:${arrMins.toString().padStart(2, '0')} ${arrPeriod}`;
    }
    return f.arrivalTime;
  }

  isFlightOperatingOnDate(flight: Flight, targetDateStr: string): boolean {
    if (!flight || !targetDateStr) return false;
    if (!flight.scheduleDate) return false;

    const startStr = flight.scheduleDate;
    const freq = flight.flightFrequency || 'SINGLE_DATE';

    if (freq === 'SINGLE_DATE') {
      return startStr === targetDateStr;
    }

    const start = new Date(startStr + 'T00:00:00');
    const target = new Date(targetDateStr + 'T00:00:00');

    if (target < start) return false;

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (freq === 'DAILY') {
      return diffDays >= 0;
    }
    if (freq === 'EVERY_3_DAYS') {
      return diffDays >= 0 && diffDays % 3 === 0;
    }
    if (freq === 'WEEKLY') {
      return diffDays >= 0 && diffDays % 7 === 0;
    }
    if (freq === 'MONTHLY') {
      if (diffDays < 0) return false;
      const dStart = start.getDate();
      const dTarget = target.getDate();
      return dStart === dTarget;
    }

    return startStr === targetDateStr;
  }

  getDisplayDateForFlight(f: Flight): string {
    if (this.searchScheduleDate && this.isFlightOperatingOnDate(f, this.searchScheduleDate)) {
      return this.searchScheduleDate;
    }
    return f.scheduleDate || 'Daily';
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
