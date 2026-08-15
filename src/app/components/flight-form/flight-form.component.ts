import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';
import { Flight } from '../../models/flight.model';

@Component({
  selector: 'app-flight-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width: 920px; margin: 0 auto;">
      <div class="card">
        <div class="card-title">
          <span>✈️ Flight Schedule & Fare Configuration [US005 / US007]</span>
        </div>
        <p class="card-subtitle">
          Register & update flight routes, departure/arrival times, and individual seat class fares (Rupees &#8377;).
        </p>

        <div *ngIf="successMsg" class="alert alert-success">
          ✅ {{ successMsg }}
        </div>

        <div *ngIf="serverError" class="alert alert-danger">
          ❌ {{ serverError }}
        </div>

        <form [formGroup]="flightForm" (ngSubmit)="onSubmit()">
          <!-- Carrier Select Box -->
          <div class="form-group">
            <label class="form-label">Carrier Company <span class="required">*</span></label>
            <select formControlName="carrierId" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('carrierId') }">
              <option value="" disabled selected>-- Select Carrier --</option>
              <option *ngFor="let c of carriers" [value]="c.carrierId">
                {{ c.carrierName }} (ID #{{ c.carrierId }})
              </option>
            </select>
            <div *ngIf="isFieldInvalid('carrierId')" class="invalid-feedback">
              Please select a carrier company.
            </div>
          </div>

          <!-- Dynamic Origin & Destination Cities Dropdowns -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Origin City <span class="required">*</span></label>
              <select formControlName="origin" (change)="onOriginChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('origin') }">
                <option *ngFor="let city of originCities" [value]="city">{{ city }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Destination City <span class="required">*</span></label>
              <select formControlName="destination" (change)="onDestinationChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('destination') || flightForm.errors?.['sameRoute'] }">
                <option *ngFor="let city of destinationCities" [value]="city">{{ city }}</option>
              </select>
              <div *ngIf="flightForm.errors?.['sameRoute']" class="invalid-feedback">
                Origin and Destination cities must be different.
              </div>
            </div>
          </div>

          <!-- Departure & Dynamic Calculated Arrival Times -->
          <div class="section-divider">Flight Schedule & Timings</div>
          <hr class="hr-rule" />

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Departure Time <span class="required">*</span></label>
              <input
                type="text"
                formControlName="departureTime"
                (input)="calculateArrivalTime()"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('departureTime') }"
                placeholder="e.g. 10:30 AM"
              />
              <div *ngIf="isFieldInvalid('departureTime')" class="invalid-feedback">
                Departure time is required.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Calculated Arrival Time (Auto) <span class="required">*</span></label>
              <input
                type="text"
                formControlName="arrivalTime"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('arrivalTime') }"
                placeholder="Auto calculated"
              />
              <div *ngIf="isFieldInvalid('arrivalTime')" class="invalid-feedback">
                Arrival time is required.
              </div>
            </div>
          </div>

          <!-- Pricing / Class Fares Verification (Rupees ₹ strictly < 10 Lakhs) -->
          <div class="section-divider">Class Fare Pricing (&#8377; INR: Max &#8377;9,99,999)</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Economy Class Fare (&#8377;) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="economyClassFare"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('economyClassFare') }"
                placeholder="e.g. 28000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('economyClassFare')" class="invalid-feedback">
                <div *ngIf="f['economyClassFare'].errors?.['required']">Economy fare is required.</div>
                <div *ngIf="f['economyClassFare'].errors?.['min']">Economy fare must be at least &#8377;1.</div>
                <div *ngIf="f['economyClassFare'].errors?.['max']">Fare cannot exceed &#8377;9,99,999 (Less than 10 Lakhs).</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Business Class Fare (&#8377;) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="businessClassFare"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('businessClassFare') || flightForm.errors?.['businessFareInvalid'] }"
                placeholder="e.g. 55000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('businessClassFare')" class="invalid-feedback">
                <div *ngIf="f['businessClassFare'].errors?.['required']">Business fare is required.</div>
                <div *ngIf="f['businessClassFare'].errors?.['min']">Business fare must be at least &#8377;1.</div>
                <div *ngIf="f['businessClassFare'].errors?.['max']">Fare cannot exceed &#8377;9,99,999 (Less than 10 Lakhs).</div>
              </div>
              <div *ngIf="flightForm.errors?.['businessFareInvalid']" class="invalid-feedback">
                Business Class Fare (&#8377;{{ flightForm.value.businessClassFare }}) MUST be greater than Economy Class Fare (&#8377;{{ flightForm.value.economyClassFare }}).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Executive Class Fare (&#8377;) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="executiveClassFare"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('executiveClassFare') || flightForm.errors?.['executiveFareInvalid'] }"
                placeholder="e.g. 95000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('executiveClassFare')" class="invalid-feedback">
                <div *ngIf="f['executiveClassFare'].errors?.['required']">Executive fare is required.</div>
                <div *ngIf="f['executiveClassFare'].errors?.['min']">Executive fare must be at least &#8377;1.</div>
                <div *ngIf="f['executiveClassFare'].errors?.['max']">Fare cannot exceed &#8377;9,99,999 (Less than 10 Lakhs).</div>
              </div>
              <div *ngIf="flightForm.errors?.['executiveFareInvalid']" class="invalid-feedback">
                Executive Class Fare (&#8377;{{ flightForm.value.executiveClassFare }}) MUST be greater than Business Class Fare (&#8377;{{ flightForm.value.businessClassFare }}).
              </div>
            </div>
          </div>

          <!-- Seat Capacity Inventory -->
          <div class="section-divider">Seat Capacities Inventory</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Economy Class Seats <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityEconomyClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityEconomyClass') }"
                placeholder="e.g. 150"
              />
              <div *ngIf="isFieldInvalid('seatCapacityEconomyClass')" class="invalid-feedback">
                Capacity must be 0 or greater.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Business Class Seats <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityBusinessClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityBusinessClass') }"
                placeholder="e.g. 30"
              />
              <div *ngIf="isFieldInvalid('seatCapacityBusinessClass')" class="invalid-feedback">
                Capacity must be 0 or greater.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Executive Class Seats <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityExecutiveClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityExecutiveClass') }"
                placeholder="e.g. 12"
              />
              <div *ngIf="isFieldInvalid('seatCapacityExecutiveClass')" class="invalid-feedback">
                Capacity must be 0 or greater.
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" (click)="goBack()" class="btn btn-secondary">
              &larr; Back to Previous Page
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting">Saving Flight...</span>
              <span *ngIf="!isSubmitting">{{ isEditMode ? 'Update Flight Details' : 'Register New Flight' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class FlightFormComponent implements OnInit {
  flightForm: FormGroup;
  carriers: Carrier[] = [];
  isSubmitting = false;
  isEditMode = false;
  flightId: number | null = null;
  successMsg = '';
  serverError = '';

  allCities = [
    'Mumbai (BOM)',
    'Delhi (DEL)',
    'Bengaluru (BLR)',
    'Hyderabad (HYD)',
    'Vijayawada (VGA)',
    'Visakhapatnam (VTZ)',
    'Chennai (MAA)',
    'Kolkata (CCU)',
    'Dubai (DXB)',
    'London (LHR)',
    'New York (JFK)',
    'Singapore (SIN)'
  ];

  originCities: string[] = [];
  destinationCities: string[] = [];

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private carrierService: CarrierService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.flightForm = this.fb.group(
      {
        carrierId: ['', [Validators.required]],
        origin: ['Mumbai (BOM)', [Validators.required]],
        destination: ['Dubai (DXB)', [Validators.required]],
        departureTime: ['10:30 AM', [Validators.required]],
        arrivalTime: ['01:45 PM', [Validators.required]],
        economyClassFare: [28000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        businessClassFare: [55000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        executiveClassFare: [95000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        seatCapacityEconomyClass: [150, [Validators.required, Validators.min(0)]],
        seatCapacityBusinessClass: [30, [Validators.required, Validators.min(0)]],
        seatCapacityExecutiveClass: [12, [Validators.required, Validators.min(0)]]
      },
      { validators: [this.originDestinationValidator, this.fareVerificationValidator] }
    );

    this.updateCityLists();
  }

  get f() {
    return this.flightForm.controls;
  }

  ngOnInit(): void {
    this.carrierService.getAllCarriers().subscribe(c => {
      this.carriers = c;
      if (c.length > 0 && !this.flightForm.value.carrierId) {
        this.flightForm.patchValue({ carrierId: c[0].carrierId });
      }
    });

    const paramId = this.route.snapshot.params['id'];
    if (paramId) {
      this.isEditMode = true;
      this.flightId = +paramId;
      this.flightService.getFlightById(this.flightId).subscribe(f => {
        this.flightForm.patchValue(f);
        this.updateCityLists();
      });
    }
  }

  updateCityLists(): void {
    const selectedOrigin = this.flightForm.value.origin;
    const selectedDest = this.flightForm.value.destination;

    this.destinationCities = this.allCities.filter(c => c !== selectedOrigin);
    this.originCities = this.allCities.filter(c => c !== selectedDest);
  }

  onOriginChanged(): void {
    this.updateCityLists();
    if (this.flightForm.value.origin === this.flightForm.value.destination) {
      if (this.destinationCities.length > 0) {
        this.flightForm.patchValue({ destination: this.destinationCities[0] });
      }
    }
    this.calculateArrivalTime();
  }

  onDestinationChanged(): void {
    this.updateCityLists();
    if (this.flightForm.value.origin === this.flightForm.value.destination) {
      if (this.originCities.length > 0) {
        this.flightForm.patchValue({ origin: this.originCities[0] });
      }
    }
    this.calculateArrivalTime();
  }

  calculateArrivalTime(): void {
    const depTime = this.flightForm.value.departureTime;
    if (!depTime) return;

    const origin = this.flightForm.value.origin || '';
    const dest = this.flightForm.value.destination || '';

    let durationHours = 3;
    let durationMinutes = 15;

    if (origin.includes('VGA') || origin.includes('VTZ') || dest.includes('VGA') || dest.includes('VTZ')) {
      durationHours = 1; durationMinutes = 45;
    } else if (origin.includes('BOM') && dest.includes('DXB')) {
      durationHours = 3; durationMinutes = 15;
    } else if (origin.includes('DEL') && dest.includes('BLR')) {
      durationHours = 2; durationMinutes = 45;
    } else if (dest.includes('LHR') || dest.includes('JFK')) {
      durationHours = 9; durationMinutes = 30;
    }

    this.flightForm.patchValue({ arrivalTime: `Dep + ${durationHours}h ${durationMinutes}m` }, { emitEvent: false });
  }

  goBack(): void {
    this.location.back();
  }

  originDestinationValidator(control: AbstractControl): ValidationErrors | null {
    const origin = control.get('origin');
    const destination = control.get('destination');
    if (origin && destination && origin.value === destination.value) {
      return { sameRoute: true };
    }
    return null;
  }

  fareVerificationValidator(control: AbstractControl): ValidationErrors | null {
    const economy = Number(control.get('economyClassFare')?.value) || 0;
    const business = Number(control.get('businessClassFare')?.value) || 0;
    const executive = Number(control.get('executiveClassFare')?.value) || 0;

    const errors: ValidationErrors = {};

    if (business <= economy) {
      errors['businessFareInvalid'] = true;
    }
    if (executive <= business) {
      errors['executiveFareInvalid'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.flightForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    this.successMsg = '';
    this.serverError = '';
    if (this.flightForm.invalid) {
      this.flightForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.flightForm.value;

    const selectedCarrier = this.carriers.find(c => c.carrierId == formVal.carrierId);
    const carrierName = selectedCarrier ? selectedCarrier.carrierName : '';

    const flightData: Flight = {
      carrierId: +formVal.carrierId,
      carrierName: carrierName,
      origin: formVal.origin,
      destination: formVal.destination,
      departureTime: formVal.departureTime.trim(),
      arrivalTime: formVal.arrivalTime.trim(),
      airFare: Number(formVal.economyClassFare),
      economyClassFare: Number(formVal.economyClassFare),
      businessClassFare: Number(formVal.businessClassFare),
      executiveClassFare: Number(formVal.executiveClassFare),
      seatCapacityEconomyClass: Number(formVal.seatCapacityEconomyClass),
      seatCapacityBusinessClass: Number(formVal.seatCapacityBusinessClass),
      seatCapacityExecutiveClass: Number(formVal.seatCapacityExecutiveClass)
    };

    if (this.isEditMode && this.flightId) {
      this.flightService.updateFlight(this.flightId, flightData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMsg = `Flight #${res.flightId} updated successfully!`;
          setTimeout(() => this.router.navigate(['/flights']), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.serverError = err.error?.message || 'Flight update failed. Please check form details.';
        }
      });
    } else {
      this.flightService.registerFlight(flightData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMsg = `Flight #${res.flightId} registered successfully!`;
          setTimeout(() => this.router.navigate(['/flights']), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.serverError = err.error?.message || 'Flight registration failed. Please check form details.';
        }
      });
    }
  }
}
