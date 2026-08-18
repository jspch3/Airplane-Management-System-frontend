import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { CarrierService } from '../../services/carrier.service';
import { Flight } from '../../models/flight.model';
import { Carrier } from '../../models/carrier.model';
import { LoginResponse } from '../../models/user.model';
import { BookingRequest, Booking } from '../../models/booking.model';

@Component({
  selector: 'app-book-flight',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div style="max-width: 960px; margin: 0 auto;">
      <div class="card">
        <div style="margin-bottom: 16px;">
          <div class="card-title">
            <span>✈️ Flight Booking & Passenger Details</span>
          </div>
        </div>
        <p class="card-subtitle">
          Select travel date & number of seats. Fill in mandatory passenger details (all ages 0-120). All fares in Indian Rupees (&#8377;).
        </p>

        <div *ngIf="bookingError" class="alert alert-danger">
          ❌ {{ bookingError }}
        </div>

        <form [formGroup]="bookingForm">
          <!-- Flight Select Box -->
          <div class="form-group">
            <label class="form-label">Selected Flight <span class="required">*</span></label>
            <select formControlName="flightId" (change)="onFlightSelected()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('flightId') }">
              <option value="" disabled selected>-- Select a Flight --</option>
              <option *ngFor="let f of flights" [value]="f.flightId">
                {{ f.carrierName }} (#{{ f.flightId }}): {{ f.origin }} &rarr; {{ f.destination }} (Dep: {{ f.departureTime }})
              </option>
            </select>
            <div *ngIf="isFieldInvalid('flightId')" class="invalid-feedback">
              Please select a flight.
            </div>
          </div>

          <!-- Date of Travel, Seat Category & Number of Seats -->
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">
                Date of Travel
                <span *ngIf="selectedFlight?.flightFrequency" class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800; margin-left: 6px;">
                  {{ getFrequencyLabel(selectedFlight?.flightFrequency) }}
                </span>
                <span class="required">*</span>
              </label>

              <div style="display: flex; gap: 8px;">
                <input
                  type="date"
                  formControlName="dateOfTravel"
                  [min]="minTravelDate"
                  [max]="maxDate"
                  (change)="onDateOfTravelChanged()"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('dateOfTravel') || !!dateError }"
                  style="font-weight: 700; color: var(--primary-navy);"
                />

                <select
                  *ngIf="validTravelDates.length > 1"
                  [(ngModel)]="selectedQuickDate"
                  [ngModelOptions]="{standalone: true}"
                  (change)="onQuickDateSelected()"
                  class="form-select"
                  style="max-width: 220px; font-weight: 700; color: #0369a1;"
                >
                  <option value="">-- Quick Valid Dates --</option>
                  <option *ngFor="let dt of validTravelDates" [value]="dt">
                    📅 {{ dt }}
                  </option>
                </select>
              </div>

              <div *ngIf="dateError" class="invalid-feedback" style="display: block; margin-top: 6px; font-weight: 700;">
                {{ dateError }}
              </div>

              <div *ngIf="!dateError" style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">
                📅 Pick any date from calendar or use quick valid dates dropdown.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Seat Category Class <span class="required">*</span></label>
              <select formControlName="seatCategory" (change)="recalculateDiscounts()" class="form-select">
                <option value="ECONOMY">Economy Class (&#8377;{{ selectedFlight?.economyClassFare || selectedFlight?.airFare }})</option>
                <option value="BUSINESS">Business Class (&#8377;{{ selectedFlight?.businessClassFare || (selectedFlight?.airFare ? selectedFlight!.airFare * 1.8 : 0) }})</option>
                <option value="EXECUTIVE">Executive Class (&#8377;{{ selectedFlight?.executiveClassFare || (selectedFlight?.airFare ? selectedFlight!.airFare * 2.8 : 0) }})</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Number of Seats (1-6) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="noOfSeats"
                (change)="onNoOfSeatsChanged()"
                (keyup)="onNoOfSeatsChanged()"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('noOfSeats') }"
                min="1" max="6"
              />
              <div *ngIf="isFieldInvalid('noOfSeats')" class="invalid-feedback">
                A customer can book a maximum of 6 tickets only per transaction.
              </div>
            </div>
          </div>

          <!-- Dynamic Multi-Passenger Cards for N Seats -->
          <div class="section-divider" style="font-weight: 800; color: var(--primary-navy); margin: 24px 0 12px 0;">
            👥 Dynamic Passenger Details (Mandatory: Name, Age 0-120, Gender; Optional: Email, Phone)
          </div>
          <hr class="hr-rule" style="margin-bottom: 20px;" />

          <div formArrayName="passengers">
            <div *ngFor="let p of passengerControls; let i = index" [formGroupName]="i" class="card" style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 24px; margin-bottom: 18px;">
              <div style="font-weight: 800; color: var(--primary-blue); font-size: 1rem; margin-bottom: 16px;">
                👤 Passenger #{{ i + 1 }} Details
              </div>

              <div class="grid-3">
                <div class="form-group">
                  <label class="form-label">Full Name <span class="required">*</span></label>
                  <input
                    type="text"
                    formControlName="name"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isPassengerFieldInvalid(i, 'name') }"
                    placeholder="Full name"
                  />
                  <div *ngIf="isPassengerFieldInvalid(i, 'name')" class="invalid-feedback">
                    Name must contain letters only with single spaces between words.
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Age (0-120 yrs) <span class="required">*</span></label>
                  <input
                    type="number"
                    formControlName="age"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isPassengerFieldInvalid(i, 'age') }"
                    placeholder="Age (0-120)"
                    min="0" max="120"
                  />
                  <div *ngIf="isPassengerFieldInvalid(i, 'age')" class="invalid-feedback">
                    Age must be between 0 and 120.
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Gender <span class="required">*</span></label>
                  <select formControlName="gender" class="form-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Email ID (Optional)</label>
                  <input
                    type="email"
                    formControlName="email"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isPassengerFieldInvalid(i, 'email') }"
                    placeholder="email@domain.com"
                  />
                  <div *ngIf="isPassengerFieldInvalid(i, 'email')" class="invalid-feedback">
                    Please enter a valid email address (e.g. name&#64;domain.com).
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    inputmode="numeric"
                    formControlName="phone"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isPassengerFieldInvalid(i, 'phone') }"
                    placeholder="10 digits starting with 6-9"
                  />
                  <div *ngIf="isPassengerFieldInvalid(i, 'phone')" class="invalid-feedback">
                    Mobile number must be 10 digits starting with 6, 7, 8, or 9.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sequential Fare Calculation Breakdown Summary Box (INR ₹) -->
          <div class="card" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid var(--primary-blue); padding: 24px; margin-top: 24px;">
            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 16px;">
              📊 Live Sequential Fare, 18% GST & Net Amount Calculation (Rupees &#8377;)
            </h4>

            <div style="display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 8px;">
              <span>Gross Base Ticket Price ({{ bookingForm.value.seatCategory }} Class x {{ bookingForm.value.noOfSeats }} seats):</span>
              <strong>&#8377;{{ grossAmount.toFixed(2) }}</strong>
            </div>

            <div *ngIf="tierDiscountAmount > 0" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--accent-emerald); margin-bottom: 8px;">
              <span>1st Step: Customer Membership Tier Discount ({{ currentUser?.customerCategory }}):</span>
              <strong>-&#8377;{{ tierDiscountAmount.toFixed(2) }}</strong>
            </div>

            <div *ngIf="bulkDiscountAmount > 0" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--accent-emerald); margin-bottom: 8px;">
              <span>2nd Step: Bulk Booking Discount (>4 seats):</span>
              <strong>-&#8377;{{ bulkDiscountAmount.toFixed(2) }}</strong>
            </div>

            <div *ngIf="advanceDiscountAmount > 0" style="display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--accent-emerald); margin-bottom: 8px;">
              <span>3rd Step: Advance Booking Perks Discount:</span>
              <strong>-&#8377;{{ advanceDiscountAmount.toFixed(2) }}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.95rem; color: #0284c7; margin-bottom: 8px;">
              <span>Add 18% Aviation GST Tax:</span>
              <strong>+&#8377;{{ gstAmount.toFixed(2) }}</strong>
            </div>

            <hr class="hr-rule" style="margin: 16px 0;" />

            <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 900; color: var(--primary-navy);">
              <span>Net Total Amount Payable:</span>
              <span style="color: var(--primary-blue);">&#8377;{{ netPayableAmount.toFixed(2) }} INR</span>
            </div>
          </div>

          <!-- Bottom Action Buttons Layout -->
          <div style="margin-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <button type="button" (click)="goBack()" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
              &larr; Back to Previous Page
            </button>
            <button type="button" (click)="openConfirmationModal()" class="btn btn-primary" style="padding: 14px 28px; font-size: 1.05rem; font-weight: 800;" [disabled]="!!dateError || bookingForm.invalid">
              🔍 Review Booking Summary &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Booking Confirmation Summary Modal -->
    <div class="modal-backdrop" *ngIf="showConfirmationModal">
      <div class="modal-content" style="max-width: 760px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-navy);">
            🔍 Flight Booking Confirmation Summary
          </h3>
          <button (click)="showConfirmationModal = false" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <div class="alert alert-info" style="margin-bottom: 20px;">
          Please review your flight itinerary, passenger details, and net fare breakdown before proceeding to payment.
        </div>

        <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
          <div class="grid-2" style="margin-bottom: 16px;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Flight Route</div>
              <div style="font-size: 1.2rem; font-weight: 900; color: var(--primary-navy);">{{ selectedFlight?.carrierName }}</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: var(--primary-blue);">{{ selectedFlight?.origin }} &rarr; {{ selectedFlight?.destination }}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Schedule & Class</div>
              <div style="font-size: 1rem; font-weight: 800; color: var(--primary-navy);">Date: {{ bookingForm.value.dateOfTravel }}</div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #0284c7; margin-top: 2px;">
                🕒 Dep: {{ selectedFlight?.departureTime || '10:30 AM' }} &nbsp;|&nbsp; 🛬 Arr: {{ selectedFlight?.arrivalTime || '01:45 PM' }}
              </div>
              <div style="font-size: 0.9rem; color: var(--text-muted);">Class: {{ bookingForm.value.seatCategory }} ({{ bookingForm.value.noOfSeats }} Seats)</div>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.85rem; font-weight: 800; color: var(--primary-navy); margin-bottom: 8px;">Passengers:</div>
            <div *ngFor="let p of passengerControls; let i = index" style="font-size: 0.875rem; color: var(--text-muted);">
              • {{ p.value.name }} ({{ p.value.age }} yrs, {{ p.value.gender }})
            </div>
          </div>

          <div style="border-top: 1px solid var(--gray-200); padding-top: 12px; display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 900; color: var(--primary-navy);">
            <span>Total Payable:</span>
            <span style="color: var(--accent-emerald);">&#8377;{{ netPayableAmount.toFixed(2) }} INR</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button (click)="showConfirmationModal = false" class="btn btn-outline">
            &larr; Modify Booking Details
          </button>
          <button (click)="confirmAndProceedToPayment()" class="btn btn-primary" style="padding: 12px 24px; font-weight: 800;">
            💳 Confirm & Proceed to Payment Gateway (&#8377;)
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Gateway Checkout Modal -->
    <div class="modal-backdrop" *ngIf="showPaymentModal">
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-navy);">
            🔒 Payment Gateway Checkout (&#8377; INR)
          </h3>
          <button (click)="closePaymentGateway()" class="btn btn-outline" style="padding: 2px 8px;">✕</button>
        </div>

        <div class="alert alert-success" style="margin-bottom: 20px;">
          <strong>Total Amount Due: &#8377;{{ netPayableAmount.toFixed(2) }}</strong> (Flight #{{ selectedFlight?.flightId }} - {{ bookingForm.value.noOfSeats }} Passengers)
        </div>

        <div *ngIf="paymentError" class="alert alert-danger" style="margin-bottom: 20px;">
          ❌ {{ paymentError }}
        </div>

        <!-- Payment Method Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button type="button" (click)="paymentMethod = 'CARD'" class="btn" [ngClass]="paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'">
            💳 Credit / Debit Card
          </button>
          <button type="button" (click)="paymentMethod = 'UPI'" class="btn" [ngClass]="paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'">
            📱 UPI / Net Banking
          </button>
        </div>

        <form [formGroup]="paymentForm" (ngSubmit)="processPayment()">
          <!-- Card Details -->
          <div *ngIf="paymentMethod === 'CARD'">
            <div class="form-group">
              <label class="form-label">Card Number (16 Digits) <span class="required">*</span></label>
              <input
                type="tel"
                inputmode="numeric"
                formControlName="cardNumber"
                class="form-control"
                [ngClass]="{ 'is-invalid': isPaymentFieldInvalid('cardNumber') }"
                placeholder="4532 8910 2341 9820"
              />
              <div *ngIf="isPaymentFieldInvalid('cardNumber')" class="invalid-feedback">
                Card number must be exactly 16 numeric digits.
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Expiry Date (MM/YY) <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="expiryDate"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isPaymentFieldInvalid('expiryDate') }"
                  placeholder="12/28"
                />
                <div *ngIf="isPaymentFieldInvalid('expiryDate')" class="invalid-feedback">
                  Expiry date must be in valid MM/YY format and in the future.
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">CVV (3 Digits) <span class="required">*</span></label>
                <input
                  type="password"
                  inputmode="numeric"
                  formControlName="cvv"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isPaymentFieldInvalid('cvv') }"
                  placeholder="123"
                  maxLength="3"
                />
                <div *ngIf="isPaymentFieldInvalid('cvv')" class="invalid-feedback">
                  CVV must be 3 numeric digits (000 is invalid).
                </div>
              </div>
            </div>
          </div>

          <!-- UPI Details -->
          <div *ngIf="paymentMethod === 'UPI'">
            <div class="form-group">
              <label class="form-label">Virtual Payment Address (VPA / UPI ID) <span class="required">*</span></label>
              <input
                type="text"
                formControlName="upiId"
                class="form-control"
                [ngClass]="{ 'is-invalid': isPaymentFieldInvalid('upiId') }"
                placeholder="username@okhdfcbank"
              />
              <div *ngIf="isPaymentFieldInvalid('upiId')" class="invalid-feedback">
                Please enter a valid UPI ID (e.g. username&#64;upi or mobile&#64;paytm).
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" (click)="closePaymentGateway()" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-success" style="padding: 12px 28px; font-weight: 800;" [disabled]="isSubmittingPayment">
              <span *ngIf="isSubmittingPayment">Authorizing Payment...</span>
              <span *ngIf="!isSubmittingPayment">Pay &#8377;{{ netPayableAmount.toFixed(2) }} Now &rarr;</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- E-Ticket Confirmation Modal -->
    <div class="modal-backdrop" *ngIf="showConfirmationTicketModal && confirmedBooking">
      <div class="modal-content" style="max-width: 860px; max-height: 88vh; overflow-y: auto; position: relative;">
        <!-- Close button top-right -->
        <button type="button" (click)="confirmAndDone()" class="no-print" style="position: absolute; right: 20px; top: 20px; background: transparent; border: none; font-size: 1.5rem; font-weight: 700; cursor: pointer; color: #64748b; z-index: 10;">
          ✕
        </button>

        <div id="printable-ticket" style="background: #ffffff; padding: 12px;">
          <!-- Ticket Header Banner -->
          <div style="background: linear-gradient(135deg, #0b1329 0%, #111c3a 100%); color: #ffffff; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 1.6rem; font-weight: 900; letter-spacing: -0.02em;">✈️ SkyRoute Enterprise</span>
                <div style="font-size: 0.85rem; color: #06b6d4; font-weight: 700; text-transform: uppercase;">Official E-Ticket & Boarding Pass</div>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-success" style="background: #10b981; color: #ffffff; font-size: 0.9rem; padding: 6px 14px; border-radius: 20px;">CONFIRMED BOOKING</span>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Txn: {{ confirmedBooking.transactionId }}</div>
              </div>
            </div>
          </div>

          <!-- Ticket Content Card -->
          <div style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; margin-bottom: 24px; background: #ffffff;">
            <!-- Flight Route Info -->
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <!-- Prominent Scheduled Travel Date Banner -->
              <div style="background: #e0f2fe; border: 1.5px solid #7dd3fc; border-radius: 10px; padding: 12px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.05rem; font-weight: 900; color: #0369a1;">
                  📅 Official Travel Date: <strong style="color: #0c4a6e;">{{ confirmedBooking.dateOfTravel || bookingForm.value.dateOfTravel }}</strong>
                </span>
                <span class="badge" style="background: #0284c7; color: #ffffff; font-weight: 800;">
                  {{ getFrequencyLabel(selectedFlight?.flightFrequency) }}
                </span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">AIRLINE CARRIER</span>
                  <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a;">{{ confirmedBooking.flightName }}</div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">BOOKING REFERENCE</span>
                  <div style="font-size: 1.2rem; font-weight: 800; color: #0284c7;">#{{ confirmedBooking.bookingId }}</div>
                </div>
              </div>

              <div class="grid-3" style="align-items: center;">
                <div>
                  <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Origin Departure</div>
                  <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">{{ selectedFlight?.origin || 'Departure City' }}</div>
                  <div style="font-size: 0.9rem; font-weight: 700; color: #0284c7; margin-top: 2px;">⏰ Dep Time: {{ selectedFlight?.departureTime }}</div>
                </div>

                <div style="text-align: center; color: #0284c7;">
                  <div style="font-size: 1.8rem; line-height: 1;">✈️</div>
                  <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; margin-top: 4px;">NON-STOP DIRECT</div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Destination Arrival</div>
                  <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">{{ selectedFlight?.destination || 'Arrival City' }}</div>
                  <div style="font-size: 0.9rem; font-weight: 700; color: #0284c7; margin-top: 2px;">⏰ Arr Time: {{ getFormattedArrivalTime(selectedFlight) }}</div>
                </div>
              </div>
            </div>

            <!-- Passenger Roster -->
            <div style="margin-bottom: 24px;">
              <h4 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                👥 Confirmed Passenger Roster
              </h4>
              <div class="table-responsive">
                <table class="table" style="font-size: 0.9rem; width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                      <th style="padding: 10px;">#</th>
                      <th style="padding: 10px;">Seat No</th>
                      <th style="padding: 10px;">Passenger Name</th>
                      <th style="padding: 10px;">Age</th>
                      <th style="padding: 10px;">Gender</th>
                      <th style="padding: 10px;">Ticket Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of confirmedBooking.passengers; let i = index" style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 10px;"><strong>{{ i + 1 }}</strong></td>
                      <td style="padding: 10px;">
                        <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800; border: 1px solid #bae6fd;">
                          💺 {{ p.seatNumber || ((i + 12) + 'A') }}
                        </span>
                      </td>
                      <td style="padding: 10px;"><strong style="color: #0f172a;">{{ p.name }}</strong></td>
                      <td style="padding: 10px;">{{ p.age }} Yrs</td>
                      <td style="padding: 10px;">{{ p.gender }}</td>
                      <td style="padding: 10px;"><span class="badge badge-success" style="background: #10b981; color: #ffffff; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem;">CONFIRMED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Payment Summary Breakdown -->
            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 16px; padding: 22px;">
              <h4 style="font-size: 1.05rem; font-weight: 800; color: #166534; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                💳 Paid Amount Summary (INR &#8377;)
              </h4>
              <div style="display: flex; justify-content: space-between; font-size: 0.925rem; margin-bottom: 6px;">
                <span>Gross Base Fare:</span>
                <strong>&#8377;{{ (confirmedBooking.grossAmount || grossAmount).toFixed(2) }}</strong>
              </div>
              <div *ngIf="(confirmedBooking.advanceDiscountAmount || advanceDiscountAmount) > 0" style="display: flex; justify-content: space-between; font-size: 0.925rem; color: #15803d; margin-bottom: 6px;">
                <span>Advance Booking Discount:</span>
                <strong>-&#8377;{{ (confirmedBooking.advanceDiscountAmount || advanceDiscountAmount).toFixed(2) }}</strong>
              </div>
              <div *ngIf="(confirmedBooking.tierDiscountAmount || tierDiscountAmount) > 0" style="display: flex; justify-content: space-between; font-size: 0.925rem; color: #15803d; margin-bottom: 6px;">
                <span>Tier Membership Discount:</span>
                <strong>-&#8377;{{ (confirmedBooking.tierDiscountAmount || tierDiscountAmount).toFixed(2) }}</strong>
              </div>
              <div *ngIf="(confirmedBooking.bulkDiscountAmount || bulkDiscountAmount) > 0" style="display: flex; justify-content: space-between; font-size: 0.925rem; color: #15803d; margin-bottom: 6px;">
                <span>Bulk Booking Discount:</span>
                <strong>-&#8377;{{ (confirmedBooking.bulkDiscountAmount || bulkDiscountAmount).toFixed(2) }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.925rem; color: #0284c7; margin-bottom: 6px;">
                <span>18% Aviation GST Tax:</span>
                <strong>+&#8377;{{ (confirmedBooking.gstAmount || gstAmount || 0).toFixed(2) }}</strong>
              </div>
              <hr style="margin: 12px 0; border: 0; border-top: 1.5px solid #86efac;" />
              <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 900; color: #14532d;">
                <span>Total Net Amount Paid:</span>
                <span>&#8377;{{ (confirmedBooking.netPayableAmount || confirmedBooking.bookingAmount || netPayableAmount).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Action Footer with Prominent OK / Done Button (Hidden during PDF/Print) -->
        <div class="no-print" style="background: var(--gray-100); padding: 20px 32px; border-top: 1.5px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <button type="button" (click)="printTicket()" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
            🖨️ Print / Save Ticket (PDF)
          </button>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button type="button" (click)="goToBookings()" class="btn btn-secondary" style="padding: 12px 22px; font-weight: 700;">
              📋 View My Bookings
            </button>
            <button type="button" (click)="confirmAndDone()" class="btn btn-success" style="padding: 12px 28px; font-weight: 800; font-size: 1.02rem;">
              ✅ OK / Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookFlightComponent implements OnInit {
  bookingForm: FormGroup;
  paymentForm: FormGroup;

  flights: Flight[] = [];
  selectedFlight: Flight | null = null;
  selectedCarrier: Carrier | null = null;
  currentUser: LoginResponse | null = null;

  minDate: string = '';
  maxDate: string = '';

  grossAmount = 0;
  advanceDiscountAmount = 0;
  tierDiscountAmount = 0;
  bulkDiscountAmount = 0;
  totalDiscountAmount = 0;
  gstAmount = 0;
  netPayableAmount = 0;

  showConfirmationModal = false;
  showPaymentModal = false;
  showConfirmationTicketModal = false;
  confirmedBooking: Booking | null = null;

  paymentMethod: 'CARD' | 'UPI' = 'CARD';
  isSubmittingPayment = false;
  bookingError = '';
  paymentError = '';
  dateError = '';
  selectedQuickDate = '';

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private bookingService: BookingService,
    private carrierService: CarrierService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    this.minDate = today.toISOString().split('T')[0];
    this.maxDate = threeMonthsLater.toISOString().split('T')[0];

    this.bookingForm = this.fb.group({
      flightId: ['', [Validators.required]],
      dateOfTravel: [this.minDate, [Validators.required, this.dateRangeValidator(this.minDate, this.maxDate)]],
      seatCategory: ['ECONOMY', [Validators.required]],
      noOfSeats: [1, [Validators.required, Validators.min(1), Validators.max(6)]],
      passengers: this.fb.array([])
    });

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.pattern(/^[0-9]{16}$/)]],
      expiryDate: ['', [this.cardExpiryValidator()]],
      cvv: ['', [Validators.pattern(/^(?!000)[0-9]{3}$/)]],
      upiId: ['', [Validators.pattern(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)]]
    });
  }

  isFlightPassed(f: Flight): boolean {
    if (!f || !f.scheduleDate) return false;
    const freq = f.flightFrequency || 'SINGLE_DATE';

    // Recurring flights always have upcoming operating dates within the 3-month window
    if (freq !== 'SINGLE_DATE') {
      return false;
    }

    try {
      const dateParts = f.scheduleDate.split('-').map(Number);
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
      return new Date() >= flightDateTime;
    } catch (e) {
      return false;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => this.currentUser = u);

    this.flightService.getAllFlights().subscribe(fList => {
      // Filter out passed flights from dropdown for Customers
      if (this.currentUser && this.currentUser.role === 'CUSTOMER') {
        this.flights = fList.filter(f => !this.isFlightPassed(f));
      } else {
        this.flights = fList;
      }

      const paramFlightId = this.route.snapshot.queryParams['flightId'];
      const paramDate = this.route.snapshot.queryParams['date'];

      if (paramFlightId) {
        this.bookingForm.patchValue({ flightId: +paramFlightId });
        this.onFlightSelected();

        if (paramDate) {
          this.bookingForm.patchValue({ dateOfTravel: paramDate });
          this.onDateOfTravelChanged();
        }
      }
    });

    this.onNoOfSeatsChanged();
  }

  get passengerControls() {
    return (this.bookingForm.get('passengers') as FormArray).controls;
  }

  dateRangeValidator(min: string, max: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const val = control.value;
      return (val >= min && val <= max) ? null : { outOfRange: true };
    };
  }

  cardExpiryValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const parts = control.value.split('/');
      if (parts.length !== 2) return { invalidFormat: true };

      const month = parseInt(parts[0], 10);
      const yearTwoDigits = parseInt(parts[1], 10);

      if (isNaN(month) || isNaN(yearTwoDigits) || month < 1 || month > 12) {
        return { invalidFormat: true };
      }

      const now = new Date();
      const currentYearTwoDigits = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (yearTwoDigits < currentYearTwoDigits || yearTwoDigits > currentYearTwoDigits + 15) {
        return { invalidFormat: true };
      }

      if (yearTwoDigits === currentYearTwoDigits && month < currentMonth) {
        return { expired: true };
      }

      return null;
    };
  }

  validTravelDates: string[] = [];

  getFrequencyLabel(freq?: string): string {
    if (freq === 'DAILY') return '🗓️ Daily';
    if (freq === 'EVERY_3_DAYS') return '🗓️ Every 3 Days';
    if (freq === 'WEEKLY') return '🗓️ Weekly';
    if (freq === 'MONTHLY') return '🗓️ Monthly';
    return '📅 Single Date';
  }

  getFormattedArrivalTime(f: Flight | null): string {
    if (!f) return '01:45 PM';
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
      const oClean = (f.origin || '').replaceAll(/\s*\([^)]*\)/g, '').trim().toUpperCase();
      const dClean = (f.destination || '').replaceAll(/\s*\([^)]*\)/g, '').trim().toUpperCase();

      if ((oClean === 'MUMBAI' && dClean === 'DELHI') || (oClean === 'DELHI' && dClean === 'MUMBAI')) durMins = 135;
      else if ((oClean === 'MUMBAI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'MUMBAI')) durMins = 105;
      else if ((oClean === 'MUMBAI' && dClean === 'HYDERABAD') || (oClean === 'HYDERABAD' && dClean === 'MUMBAI')) durMins = 85;
      else if ((oClean === 'MUMBAI' && dClean === 'DUBAI') || (oClean === 'DUBAI' && dClean === 'MUMBAI')) durMins = 210;
      else if ((oClean === 'DELHI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'DELHI')) durMins = 170;
      else if ((oClean === 'VIJAYAWADA' && dClean === 'VISAKHAPATNAM') || (oClean === 'VISAKHAPATNAM' && dClean === 'VIJAYAWADA')) durMins = 60;

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

  isPassedToday(flight?: Flight | null): boolean {
    if (!flight || !flight.departureTime) return false;
    try {
      let depTimeStr = flight.departureTime;
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

      const now = new Date();
      const flightDepToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return now >= flightDepToday;
    } catch (e) {
      return false;
    }
  }

  get minTravelDate(): string {
    if (this.selectedFlight && this.isPassedToday(this.selectedFlight)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  generateValidTravelDates(): void {
    this.validTravelDates = [];
    if (!this.selectedFlight) return;

    const startStr = this.selectedFlight.scheduleDate || new Date().toISOString().split('T')[0];
    const freq = this.selectedFlight.flightFrequency || 'SINGLE_DATE';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const passedToday = this.isPassedToday(this.selectedFlight);

    let minValidDate = new Date(today);
    if (passedToday) {
      minValidDate.setDate(minValidDate.getDate() + 1);
    }

    const startDate = new Date(startStr + 'T00:00:00');
    const threeMonthsOut = new Date();
    threeMonthsOut.setMonth(today.getMonth() + 3);

    let curr = new Date(startDate);
    while (curr < minValidDate) {
      if (freq === 'DAILY') curr.setDate(curr.getDate() + 1);
      else if (freq === 'EVERY_3_DAYS') curr.setDate(curr.getDate() + 3);
      else if (freq === 'WEEKLY') curr.setDate(curr.getDate() + 7);
      else if (freq === 'MONTHLY') curr.setMonth(curr.getMonth() + 1);
      else break;
    }

    while (curr <= threeMonthsOut) {
      const iso = curr.toISOString().split('T')[0];
      const currObj = new Date(iso + 'T00:00:00');

      if (currObj >= minValidDate) {
        this.validTravelDates.push(iso);
      }

      if (freq === 'DAILY') curr.setDate(curr.getDate() + 1);
      else if (freq === 'EVERY_3_DAYS') curr.setDate(curr.getDate() + 3);
      else if (freq === 'WEEKLY') curr.setDate(curr.getDate() + 7);
      else if (freq === 'MONTHLY') curr.setMonth(curr.getMonth() + 1);
      else break;

      if (this.validTravelDates.length >= 90) break;
    }

    if (this.validTravelDates.length === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.validTravelDates = [tomorrow.toISOString().split('T')[0]];
    }
  }

  isFlightOperatingOnDate(flight: Flight | null, targetDateStr: string): boolean {
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

  onDateOfTravelChanged(): void {
    this.dateError = '';
    const dateVal = this.bookingForm.value.dateOfTravel;
    if (!dateVal || !this.selectedFlight) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (dateVal === todayStr && this.isPassedToday(this.selectedFlight)) {
      const nextDate = this.validTravelDates[0] || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      this.dateError = `⏰ Departure time (${this.selectedFlight.departureTime}) for today's flight (${dateVal}) has already passed. Please select tomorrow (${nextDate}) or an upcoming operating date.`;
      return;
    }

    if (!this.isFlightOperatingOnDate(this.selectedFlight, dateVal)) {
      const freqLabel = this.getFrequencyLabel(this.selectedFlight.flightFrequency);
      const validList = this.validTravelDates.slice(0, 4).join(', ');
      this.dateError = `❌ Flight #${this.selectedFlight.flightId} does not operate on ${dateVal}. Schedule: ${freqLabel}. Valid operating dates: ${validList}...`;
    } else {
      this.selectedQuickDate = dateVal;
      this.recalculateDiscounts();
    }
  }

  onQuickDateSelected(): void {
    if (this.selectedQuickDate) {
      this.bookingForm.patchValue({ dateOfTravel: this.selectedQuickDate });
      this.onDateOfTravelChanged();
    }
  }

  onFlightSelected(): void {
    const flightId = +this.bookingForm.value.flightId;
    this.selectedFlight = this.flights.find(f => f.flightId === flightId) || null;

    this.generateValidTravelDates();

    if (this.validTravelDates.length > 0) {
      this.bookingForm.patchValue({
        dateOfTravel: this.validTravelDates[0]
      });
    } else if (this.selectedFlight?.scheduleDate) {
      this.bookingForm.patchValue({
        dateOfTravel: this.selectedFlight.scheduleDate
      });
    }

    this.onDateOfTravelChanged();

    if (this.selectedFlight?.carrierId) {
      this.carrierService.getCarrierById(this.selectedFlight.carrierId).subscribe(c => {
        this.selectedCarrier = c;
        this.recalculateDiscounts();
      });
    } else {
      this.recalculateDiscounts();
    }
  }

  onNoOfSeatsChanged(): void {
    const count = Number(this.bookingForm.value.noOfSeats) || 1;
    const passengersArray = this.bookingForm.get('passengers') as FormArray;

    while (passengersArray.length < count) {
      passengersArray.push(this.createPassengerGroup());
    }
    while (passengersArray.length > count) {
      passengersArray.removeAt(passengersArray.length - 1);
    }

    this.recalculateDiscounts();
  }

  createPassengerGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]],
      age: [25, [Validators.required, Validators.min(0), Validators.max(120)]],
      gender: ['Male', [Validators.required]],
      email: ['', [Validators.pattern(/^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: ['', [Validators.pattern(/^$|^[6-9][0-9]{9}$/)]]
    });
  }



  recalculateDiscounts(): void {
    if (!this.selectedFlight) {
      this.grossAmount = 0;
      this.tierDiscountAmount = 0;
      this.bulkDiscountAmount = 0;
      this.advanceDiscountAmount = 0;
      this.gstAmount = 0;
      this.netPayableAmount = 0;
      return;
    }

    const seats = Number(this.bookingForm.value.noOfSeats) || 1;
    const cat = this.bookingForm.value.seatCategory;

    let baseFare = this.selectedFlight.economyClassFare || this.selectedFlight.airFare || 5000;
    if (cat === 'BUSINESS') {
      baseFare = this.selectedFlight.businessClassFare || (baseFare * 1.8);
    } else if (cat === 'EXECUTIVE') {
      baseFare = this.selectedFlight.executiveClassFare || (baseFare * 2.8);
    }

    this.grossAmount = baseFare * seats;

    // 1. Membership Tier Discount (First)
    let tierPct = 0;
    const userCat = this.currentUser?.customerCategory?.toUpperCase();
    if (this.selectedCarrier && userCat) {
      if (userCat === 'SILVER') tierPct = this.selectedCarrier.silverUserDiscount || 0;
      else if (userCat === 'GOLD') tierPct = this.selectedCarrier.goldUserDiscount || 0;
      else if (userCat === 'PLATINUM') tierPct = this.selectedCarrier.platinumUserDiscount || 0;
    }
    this.tierDiscountAmount = (this.grossAmount * tierPct) / 100;
    const priceAfterTier = Math.max(0, this.grossAmount - this.tierDiscountAmount);

    // 2. Bulk Booking Discount (Second - Applicable for >4 seats)
    let bulkPct = 0;
    if (seats > 4 && this.selectedCarrier) {
      bulkPct = this.selectedCarrier.bulkBookingDiscount || 0;
    }
    this.bulkDiscountAmount = (priceAfterTier * bulkPct) / 100;
    const priceAfterBulk = Math.max(0, priceAfterTier - this.bulkDiscountAmount);

    // 3. Advance Booking Discount (Third)
    let advPct = 0;
    if (this.bookingForm.value.dateOfTravel && this.selectedCarrier) {
      const travelDate = new Date(this.bookingForm.value.dateOfTravel);
      const today = new Date();
      const diffDays = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays >= 90) advPct = this.selectedCarrier.discount90DaysAdvanceBooking || 0;
      else if (diffDays >= 60) advPct = this.selectedCarrier.discount60DaysAdvanceBooking || 0;
      else if (diffDays >= 30) advPct = this.selectedCarrier.discount30DaysAdvanceBooking || 0;
    }
    this.advanceDiscountAmount = (priceAfterBulk * advPct) / 100;
    const subtotalPrice = Math.max(this.grossAmount * 0.20, priceAfterBulk - this.advanceDiscountAmount);

    // 4. Add 18% Aviation GST Tax
    this.gstAmount = subtotalPrice * 0.18;

    // 5. Total Discount & Non-Zero Net Total Payable
    this.totalDiscountAmount = this.tierDiscountAmount + this.bulkDiscountAmount + this.advanceDiscountAmount;
    this.netPayableAmount = Math.max(500, subtotalPrice + this.gstAmount);
  }

  goBack(): void {
    this.location.back();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.bookingForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPassengerFieldInvalid(index: number, field: string): boolean {
    const passengerGroup = (this.bookingForm.get('passengers') as FormArray).at(index) as FormGroup;
    const control = passengerGroup.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPaymentFieldInvalid(field: string): boolean {
    const control = this.paymentForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openConfirmationModal(): void {
    this.bookingError = '';
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.bookingError = 'Please fix all highlighted errors in the form before proceeding.';
      return;
    }
    this.showConfirmationModal = true;
  }

  confirmAndProceedToPayment(): void {
    this.showConfirmationModal = false;
    this.openPaymentGateway();
  }

  openPaymentGateway(): void {
    this.paymentError = '';
    this.showPaymentModal = true;
  }

  closePaymentGateway(): void {
    this.showPaymentModal = false;
  }

  processPayment(): void {
    this.paymentError = '';

    if (this.paymentMethod === 'CARD') {
      const cardNum = this.paymentForm.value.cardNumber;
      const expiry = this.paymentForm.value.expiryDate;
      const cvv = this.paymentForm.value.cvv;
      if (!cardNum || !expiry || !cvv || this.paymentForm.get('cardNumber')?.invalid || this.paymentForm.get('expiryDate')?.invalid || this.paymentForm.get('cvv')?.invalid) {
        this.paymentError = 'Please enter valid 16-digit Card Number, valid MM/YY Expiry, and valid 3-digit CVV (non-zero).';
        return;
      }
    } else if (this.paymentMethod === 'UPI') {
      const upi = this.paymentForm.value.upiId;
      if (!upi || this.paymentForm.get('upiId')?.invalid) {
        this.paymentError = 'Please enter a valid UPI ID (e.g. username@upi).';
        return;
      }
    }

    if (!this.currentUser) {
      this.paymentError = 'User authentication expired. Please sign in again.';
      return;
    }

    this.isSubmittingPayment = true;
    const formVal = this.bookingForm.value;

    const request: BookingRequest = {
      userId: this.currentUser.userId,
      flightId: +formVal.flightId,
      noOfSeats: +formVal.noOfSeats,
      seatCategory: formVal.seatCategory,
      dateOfTravel: formVal.dateOfTravel,
      passengers: formVal.passengers,
      paymentMethod: this.paymentMethod,
      cardNumber: this.paymentForm.value.cardNumber,
      expiryDate: this.paymentForm.value.expiryDate,
      cvv: this.paymentForm.value.cvv,
      upiId: this.paymentForm.value.upiId
    };

    this.bookingService.bookFlight(request).subscribe({
      next: (res: Booking) => {
        this.isSubmittingPayment = false;
        this.confirmedBooking = res;
        this.showPaymentModal = false;
        this.showConfirmationTicketModal = true;
      },
      error: (err: any) => {
        this.isSubmittingPayment = false;
        this.paymentError = err.error?.message || 'Payment authorization failed. Please try again.';
      }
    });
  }

  printTicket(): void {
    window.print();
  }

  confirmAndDone(): void {
    this.showConfirmationTicketModal = false;
    this.router.navigate(['/bookings']);
  }

  goToBookings(): void {
    this.showConfirmationTicketModal = false;
    this.router.navigate(['/bookings']);
  }
}
