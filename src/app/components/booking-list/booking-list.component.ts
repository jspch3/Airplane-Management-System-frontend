import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Booking } from '../../models/booking.model';
import { LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1150px; margin: 0 auto;">
      <div class="card">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">
              <span>📋 Flight Booking History & Passenger Management</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              View flight booking records and print e-tickets.
            </p>
          </div>
          <div *ngIf="user && user.role === 'ADMIN'">
            <button (click)="openAdminCancelModal()" class="btn btn-danger" style="padding: 10px 18px; font-weight: 800; font-size: 0.9rem;">
              🚫 Cancel Flight Schedule Date & Refund Users
            </button>
          </div>
        </div>

        <div *ngIf="cancellationSuccess" class="alert alert-success">
          ✅ {{ cancellationSuccess }}
        </div>

        <div *ngIf="isLoading" style="text-align: center; padding: 40px; color: var(--gray-600);">
          Loading booking history records...
        </div>

        <!-- Cancellation Refund Rules Instructions Banner -->
        <div class="alert alert-info" style="margin-bottom: 24px; flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
            <span>ℹ️</span> Cancellation & Refund Rules:
          </div>
          <ul style="margin-left: 24px; margin-top: 4px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
            <li>Cancellation <strong>&ge; 20 days prior</strong> to travel date: Max <strong>75% refund</strong>.</li>
            <li>Cancellation <strong>2 to 19 days prior</strong> to travel date: Max <strong>40% refund</strong>.</li>
            <li>Cancellation <strong>&lt; 2 days prior</strong> to travel date (0 or 1 day prior): Max <strong>20% refund</strong>.</li>
            <li>Cancellations are allowed per passenger; partial passenger cancellations recalculate proportional refunds.</li>
          </ul>
        </div>

        <div *ngIf="!isLoading && bookings.length > 0" class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Flight & Route</th>
                <th>Departure & Arrival Timings</th>
                <th *ngIf="user && user.role === 'ADMIN'">User ID</th>
                <th *ngIf="user && user.role === 'CUSTOMER'">Customer Username</th>
                <th>Travel Date</th>
                <th>Seats & Class</th>
                <th>Net Paid (&#8377;)</th>
                <th>Refund (&#8377;)</th>
                <th>Status</th>
                <th>Transaction Ref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of bookings">
                <td><strong>#{{ b.bookingId }}</strong></td>
                <td>
                  <div style="font-weight: 700; color: var(--primary-navy);">{{ b.flightName }}</div>
                </td>
                <td>
                  <div style="font-size: 0.85rem; color: #0284c7; font-weight: 700;">
                    🕒 Dep: {{ b.departureTime || '10:30 AM' }}<br/>
                    🛬 Arr: {{ b.arrivalTime || '01:45 PM' }}
                  </div>
                </td>
                
                <!-- Admin View: Displays ONLY User ID -->
                <td *ngIf="user && user.role === 'ADMIN'">
                  <div style="font-weight: 800; color: var(--primary-navy);">User ID: #{{ b.userId }}</div>
                </td>

                <!-- Customer View: Displays Username -->
                <td *ngIf="user && user.role === 'CUSTOMER'">
                  <div style="font-weight: 800; color: var(--primary-navy);">👤 {{ b.userName }}</div>
                </td>

                <td>{{ b.dateOfTravel }}</td>
                <td>
                  <div>{{ b.noOfSeats }} seats</div>
                  <span class="badge" style="background: #f1f5f9; color: #475569;">{{ b.seatCategory }}</span>
                </td>
                <td><strong style="color: var(--primary-blue);">&#8377;{{ (b.netPayableAmount || b.bookingAmount || 0).toFixed(2) }}</strong></td>
                <td>
                  <span *ngIf="b.refundAmount > 0" style="color: var(--accent-emerald); font-weight: 800;">
                    &#8377;{{ b.refundAmount.toFixed(2) }}
                  </span>
                  <span *ngIf="b.refundAmount === 0" style="color: var(--gray-400);">&#8377;0.00</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': b.bookingStatus === 'BOOKED' || b.bookingStatus === 'Booked',
                    'badge-warning': b.bookingStatus === 'PARTIALLY_CANCELLED' || b.bookingStatus === 'Partially Cancelled',
                    'badge-danger': b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'Cancelled' || b.bookingStatus === 'CANCELLED_BY_ADMIN'
                  }">
                    {{ b.bookingStatus === 'CANCELLED_BY_ADMIN' ? 'CANCELLED BY ADMIN (100% REFUNDED)' : b.bookingStatus }}
                  </span>
                </td>
                <td><code style="font-size: 0.8rem; background: var(--gray-100); padding: 3px 6px; border-radius: 4px;">{{ b.transactionId }}</code></td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                    <button (click)="printTicket(b)" class="btn btn-primary btn-sm" style="padding: 6px 10px; font-size: 0.8rem;">
                      🖨️ Print Ticket
                    </button>

                    <!-- Cancel Ticket Option: Available for both Customer and Admin -->
                    <button
                      *ngIf="b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'CANCELLED_BY_ADMIN' && !isJourneyCompleted(b)"
                      (click)="openCancelModal(b)"
                      class="btn btn-danger btn-sm"
                      style="padding: 6px 10px; font-size: 0.8rem;"
                    >
                      🚫 Cancel Ticket
                    </button>

                    <span
                      *ngIf="user && user.role === 'CUSTOMER' && isJourneyCompleted(b) && b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'CANCELLED_BY_ADMIN'"
                      class="badge"
                      style="background: #f1f5f9; color: #64748b; font-size: 0.75rem; font-weight: 700; border: 1px solid #cbd5e1;"
                    >
                      ✓ Journey Completed
                    </span>
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

    <!-- Printable E-Ticket / Boarding Pass Modal -->
    <div class="modal-backdrop" *ngIf="showPrintTicketModal && printableBooking">
      <div class="modal-content" style="max-width: 820px; max-height: 88vh; overflow-y: auto;">
        <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-navy);">
            ✈️ E-Ticket & Boarding Pass Preview
          </h3>
          <button (click)="closePrintModal()" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <!-- Printable Document Canvas -->
        <div id="printable-ticket" class="printable-ticket-card" style="border: 2px solid var(--primary-blue); border-radius: 16px; padding: 28px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--gray-200); padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <span style="font-size: 1.4rem; font-weight: 900; color: var(--primary-blue);">SkyRoute Enterprise Airlines</span>
              <div style="font-size: 0.85rem; color: var(--gray-600);">Official Electronic Flight Pass</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase;">Transaction Reference</div>
              <code style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy);">{{ printableBooking.transactionId }}</code>
            </div>
          </div>

          <!-- Prominent Travel Date Banner -->
          <div style="background: #e0f2fe; border: 1.5px solid #7dd3fc; border-radius: 10px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 1.1rem; font-weight: 900; color: #0369a1;">
              📅 Official Travel Date: <strong style="color: #0c4a6e;">{{ printableBooking.dateOfTravel }}</strong>
            </span>
            <span class="badge" style="background: #0284c7; color: #ffffff; font-weight: 800;">CONFIRMED TICKET</span>
          </div>

          <div class="grid-2" style="margin-bottom: 20px; background: var(--gray-50); padding: 18px; border-radius: 12px;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--gray-600); text-transform: uppercase;">Flight Carrier & Route</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: var(--primary-navy);">{{ printableBooking.flightName }}</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: var(--primary-blue);">Booking ID: #{{ printableBooking.bookingId }}</div>
              <div style="font-size: 0.85rem; color: var(--gray-800); margin-top: 4px;">
                Customer: <strong>👤 {{ printableBooking.userName }}</strong> (User ID: #{{ printableBooking.userId }})
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--gray-600); text-transform: uppercase;">Schedule & Flight Timings</div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy);">Date: {{ printableBooking.dateOfTravel }}</div>
              <div style="font-size: 0.95rem; font-weight: 800; color: #0284c7; margin-top: 4px;">
                🕒 Dep: {{ printableBooking.departureTime || '10:30 AM' }} &nbsp;|&nbsp; 🛬 Arr: {{ getFormattedArrivalTime(printableBooking) }}
              </div>
              <div style="font-size: 0.85rem; color: var(--gray-600); margin-top: 2px;">Class: <strong>{{ printableBooking.seatCategory }} CLASS</strong></div>
            </div>
          </div>

          <!-- Passenger Table -->
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">Confirmed Passenger Roster</h4>
            <table class="table" style="font-size: 0.875rem;">
              <thead>
                <tr style="background: var(--gray-100);">
                  <th>#</th>
                  <th>Seat No</th>
                  <th>Passenger Name</th>
                  <th>Age & Gender</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of printableBooking.passengers; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800; border: 1px solid #bae6fd;">
                      💺 {{ p.seatNumber || ((i + 12) + 'A') }}
                    </span>
                  </td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ p.age }} yrs ({{ p.gender }})</td>
                  <td>
                    <span class="badge" [ngClass]="(p.status === 'CANCELLED' || p.status === 'Cancelled') ? 'badge-cancelled' : 'badge-booked'">
                      {{ p.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Summary -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="font-weight: 800; color: var(--primary-navy); font-size: 0.95rem; margin-bottom: 8px;">💳 Billing & Tax Breakdown Summary (INR &#8377;):</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--gray-700); margin-bottom: 4px;">
              <span>Gross Base Fare:</span>
              <strong>&#8377;{{ (printableBooking.grossAmount || 0).toFixed(2) }}</strong>
            </div>
            <div *ngIf="(printableBooking.totalDiscountAmount || 0) > 0" style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--accent-emerald); margin-bottom: 4px;">
              <span>Total Discounts Applied:</span>
              <strong>-&#8377;{{ (printableBooking.totalDiscountAmount || 0).toFixed(2) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #0284c7; margin-bottom: 4px;">
              <span>18% Aviation GST Tax:</span>
              <strong>+&#8377;{{ (printableBooking.gstAmount || ((printableBooking.grossAmount - (printableBooking.totalDiscountAmount || 0)) * 0.18) || 0).toFixed(2) }}</strong>
            </div>
            <hr style="margin: 8px 0; border: none; border-top: 1px dashed var(--gray-300);" />
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.85rem; color: var(--gray-600);">Payment Method: <strong>{{ printableBooking.paymentMethod || 'SECURE ONLINE' }}</strong></span>
              <div style="text-align: right;">
                <span style="font-size: 0.9rem; color: var(--gray-600);">Total Amount Paid: </span>
                <span style="font-size: 1.35rem; font-weight: 900; color: var(--accent-emerald);">&#8377;{{ (printableBooking.netPayableAmount || printableBooking.bookingAmount || 0).toFixed(2) }} INR</span>
              </div>
            </div>
          </div>
        </div>

        <div class="no-print" style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
          <button (click)="closePrintModal()" class="btn btn-outline">Close Preview</button>
          <button (click)="triggerPrintDialog()" class="btn btn-primary" style="padding: 12px 24px; font-weight: 800;">
            🖨️ Trigger Browser Print (PDF)
          </button>
        </div>
      </div>
    </div>

    <!-- Partial Cancellation & Refund Breakdown Modal -->
    <div class="modal-backdrop" *ngIf="showCancelModal && activeBooking">
      <div class="modal-content" style="max-width: 680px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-navy);">
            🚫 Partial Ticket Cancellation & Refund Policy
          </h3>
          <button (click)="closeCancelModal()" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <div *ngIf="user && user.role === 'ADMIN'" class="info-banner" style="margin-bottom: 16px; background: #fffbebfb; border-color: #fcd34d; color: #b45309; font-weight: 700;">
          👑 Admin Cancellation Notice: Cancelling this customer ticket as Administrator will issue a <strong>100% Full Refund</strong> (&#8377;{{ (activeBooking.netPayableAmount || activeBooking.bookingAmount || 0).toFixed(2) }}) to the customer account.
        </div>

        <div *ngIf="!user || user.role !== 'ADMIN'" class="info-banner" style="margin-bottom: 16px;">
          Select passenger(s) below to cancel from Booking #{{ activeBooking.bookingId }}. Proportional refund (&#8377;) will be automatically calculated.
        </div>

        <div *ngIf="cancelError" class="alert alert-danger" style="margin-bottom: 16px;">
          ❌ {{ cancelError }}
        </div>

        <div class="table-responsive" style="margin-bottom: 16px;">
          <table class="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Passenger Name</th>
                <th>Age & Gender</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of activeBooking.passengers">
                <td>
                  <input
                    type="checkbox"
                    [disabled]="p.status === 'CANCELLED' || p.status === 'Cancelled'"
                    (change)="togglePassengerSelection(p.passengerId)"
                    style="width: 18px; height: 18px; cursor: pointer;"
                  />
                </td>
                <td><strong>{{ p.name }}</strong></td>
                <td>{{ p.age }} yrs ({{ p.gender }})</td>
                <td>
                  <span class="badge" [ngClass]="(p.status === 'CANCELLED' || p.status === 'Cancelled') ? 'badge-cancelled' : 'badge-booked'">
                    {{ p.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Calculated Refund Breakdown Box -->
        <div *ngIf="selectedPassengerIds.length > 0" style="background: rgba(2, 132, 199, 0.08); border: 1.5px solid rgba(2, 132, 199, 0.25); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 8px;">
            💰 Refund Estimate Breakdown (&#8377; INR):
          </div>
          <div style="font-size: 0.9rem; color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Selected Passengers to Cancel:</span>
            <strong>{{ selectedPassengerIds.length }} Seat(s)</strong>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Calculated Carrier Refund Tier:</span>
            <strong>{{ getRefundPercentage() }}% Policy Refund</strong>
          </div>
          <div style="font-size: 1.15rem; font-weight: 900; color: var(--accent-emerald); display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid rgba(2, 132, 199, 0.2); padding-top: 8px;">
            <span>Estimated Refund Credit:</span>
            <span>&#8377;{{ calculateEstimatedRefund().toFixed(2) }} INR</span>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <button (click)="closeCancelModal()" class="btn btn-outline">Keep Booking</button>
          <button (click)="submitPartialCancellation()" class="btn btn-danger" [disabled]="selectedPassengerIds.length === 0 || isSubmittingCancel">
            <span *ngIf="isSubmittingCancel">Processing Cancellation...</span>
            <span *ngIf="!isSubmittingCancel">Confirm Cancellation & Process &#8377; Refund</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Admin Flight Date Cancellation Modal -->
    <div class="modal-backdrop" *ngIf="showAdminCancelModal">
      <div class="modal-content" style="max-width: 520px; padding: 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #991b1b; display: flex; align-items: center; gap: 8px;">
            <span>🚫</span> Cancel Flight Schedule for Date
          </h3>
          <button (click)="closeAdminCancelModal()" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <p style="font-size: 0.875rem; color: #475569; margin-bottom: 20px;">
          Select a flight and operating date to cancel. Affected customer bookings will be marked as <strong>CANCELLED BY ADMIN</strong> with <strong>100% Full Refunds</strong> automatically credited to their accounts.
        </p>

        <div *ngIf="adminCancelError" class="alert alert-danger" style="margin-bottom: 16px;">
          ❌ {{ adminCancelError }}
        </div>

        <div class="form-group">
          <label class="form-label">Flight ID <span class="required">*</span></label>
          <input
            type="number"
            [(ngModel)]="adminCancelFlightId"
            class="form-control"
            placeholder="e.g. 1"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Date of Travel <span class="required">*</span></label>
          <input
            type="date"
            [(ngModel)]="adminCancelDate"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Reason for Cancellation</label>
          <input
            type="text"
            [(ngModel)]="adminCancelReason"
            class="form-control"
            placeholder="e.g. Weather Advisory / Operational Reasons"
          />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" (click)="closeAdminCancelModal()" class="btn btn-secondary">
            Cancel
          </button>
          <button type="button" (click)="submitAdminCancelFlightDate()" class="btn btn-danger" [disabled]="isCancellingAdminFlight">
            <span *ngIf="isCancellingAdminFlight">Cancelling & Refunding...</span>
            <span *ngIf="!isCancellingAdminFlight">🚫 Confirm & Refund Customers</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class BookingListComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = true;
  user: LoginResponse | null = null;

  showCancelModal = false;
  showPrintTicketModal = false;
  showAdminCancelModal = false;
  printableBooking: Booking | null = null;

  adminCancelFlightId: number | null = null;
  adminCancelDate = '';
  adminCancelReason = 'Weather Advisory / Operational Reasons';
  isCancellingAdminFlight = false;
  adminCancelError = '';

  activeBooking: Booking | null = null;
  selectedPassengerIds: number[] = [];
  isSubmittingCancel = false;

  cancellationSuccess = '';
  cancelError = '';

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      this.loadBookings();
    });
  }

  goBack(): void {
    this.location.back();
  }

  loadBookings(): void {
    if (!this.user) return;
    this.isLoading = true;
    const request$ = this.user.role === 'ADMIN'
      ? this.bookingService.getAllBookings()
      : this.bookingService.getBookingsByUser(this.user.userId);

    request$.subscribe({
      next: (data: Booking[]) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  isJourneyCompleted(b: Booking): boolean {
    if (!b.dateOfTravel) return false;
    try {
      const travelDateStr = b.dateOfTravel;
      let depTimeStr = b.departureTime || '10:30 AM';

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

      const dateParts = travelDateStr.split('-').map(Number);
      if (dateParts.length !== 3) return false;

      const flightDepDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes);
      return new Date() >= flightDepDate;
    } catch (e) {
      return false;
    }
  }

  getFormattedArrivalTime(b: any): string {
    if (!b) return '01:45 PM';
    if (!b.arrivalTime || b.arrivalTime.includes('+') || b.arrivalTime.toLowerCase().includes('2h')) {
      const depStr = b.departureTime || '10:30 AM';
      let depP = 'AM';
      let cleanDep = depStr;
      if (cleanDep.includes('PM')) { depP = 'PM'; cleanDep = cleanDep.replace('PM', '').trim(); }
      else if (cleanDep.includes('AM')) { depP = 'AM'; cleanDep = cleanDep.replace('AM', '').trim(); }

      const parts = cleanDep.split(':');
      let h = parseInt(parts[0], 10) || 10;
      let m = parseInt(parts[1], 10) || 30;

      if (depP === 'PM' && h < 12) h += 12;
      if (depP === 'AM' && h === 12) h = 0;

      let totalMins = (h * 60) + m + 120;
      totalMins = totalMins % (24 * 60);

      let arrHours24 = Math.floor(totalMins / 60);
      let arrMins = totalMins % 60;

      let arrPeriod = arrHours24 >= 12 ? 'PM' : 'AM';
      let arrHours12 = arrHours24 % 12;
      if (arrHours12 === 0) arrHours12 = 12;

      return `${arrHours12.toString().padStart(2, '0')}:${arrMins.toString().padStart(2, '0')} ${arrPeriod}`;
    }
    return b.arrivalTime;
  }

  printTicket(b: Booking): void {
    this.printableBooking = b;
    this.showPrintTicketModal = true;
  }

  closePrintModal(): void {
    this.showPrintTicketModal = false;
    this.printableBooking = null;
  }

  triggerPrintDialog(): void {
    window.print();
  }

  openCancelModal(b: Booking): void {
    this.activeBooking = b;
    this.selectedPassengerIds = [];
    this.cancelError = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.activeBooking = null;
    this.selectedPassengerIds = [];
  }

  togglePassengerSelection(passengerId: number): void {
    const idx = this.selectedPassengerIds.indexOf(passengerId);
    if (idx >= 0) {
      this.selectedPassengerIds.splice(idx, 1);
    } else {
      this.selectedPassengerIds.push(passengerId);
    }
  }

  getRefundPercentage(): number {
    if (!this.activeBooking || !this.activeBooking.dateOfTravel) return 20;
    const travelDate = new Date(this.activeBooking.dateOfTravel);
    const today = new Date();
    const diffDays = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays >= 20) return 75;
    if (diffDays >= 2) return 40;
    return 20;
  }

  calculateEstimatedRefund(): number {
    if (!this.activeBooking || this.selectedPassengerIds.length === 0) return 0;
    const netPaid = this.activeBooking.netPayableAmount || this.activeBooking.bookingAmount || 0;
    const totalSeats = this.activeBooking.noOfSeats || 1;
    const perSeatFare = netPaid / totalSeats;
    const pct = this.getRefundPercentage() / 100;
    return perSeatFare * this.selectedPassengerIds.length * pct;
  }

  submitPartialCancellation(): void {
    if (!this.activeBooking || this.selectedPassengerIds.length === 0) return;

    this.cancelError = '';
    this.isSubmittingCancel = true;
    this.cancelError = '';

    const role = this.user?.role || 'CUSTOMER';
    this.bookingService.cancelPartialOrFull(this.activeBooking.bookingId, { passengerIds: this.selectedPassengerIds }, role).subscribe({
      next: (res: Booking) => {
        this.isSubmittingCancel = false;
        this.cancellationSuccess = `Cancellation processed successfully! Refund of \u20B9${(res.refundAmount || 0).toFixed(2)} issued.`;
        this.closeCancelModal();
        this.loadBookings();
      },
      error: (err: any) => {
        this.isSubmittingCancel = false;
        this.cancelError = err.error?.message || 'Cancellation failed.';
      }
    });
  }

  openAdminCancelModal(): void {
    this.adminCancelFlightId = null;
    this.adminCancelDate = new Date().toISOString().split('T')[0];
    this.adminCancelReason = 'Weather Advisory / Operational Reasons';
    this.adminCancelError = '';
    this.showAdminCancelModal = true;
  }

  closeAdminCancelModal(): void {
    this.showAdminCancelModal = false;
  }

  submitAdminCancelFlightDate(): void {
    if (!this.adminCancelFlightId || !this.adminCancelDate) {
      this.adminCancelError = 'Please select a valid Flight ID and Date of Travel.';
      return;
    }

    this.isCancellingAdminFlight = true;
    this.adminCancelError = '';

    this.bookingService.cancelFlightDate(this.adminCancelFlightId, this.adminCancelDate, this.adminCancelReason).subscribe({
      next: (cancelledBookings) => {
        this.isCancellingAdminFlight = false;
        this.showAdminCancelModal = false;
        this.cancellationSuccess = `Successfully cancelled Flight #${this.adminCancelFlightId} on ${this.adminCancelDate}. Total ${cancelledBookings.length} booking(s) updated with 100% full customer refunds!`;
        this.loadBookings();
      },
      error: (err) => {
        this.isCancellingAdminFlight = false;
        this.adminCancelError = err?.error?.message || 'Failed to cancel flight date schedule.';
      }
    });
  }
}
