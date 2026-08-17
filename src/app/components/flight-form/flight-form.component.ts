import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';
import { Flight } from '../../models/flight.model';
import { MAJOR_AIRPORTS } from '../../constants/location.data';

@Component({
  selector: 'app-flight-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width: 920px; margin: 0 auto;">
      <div class="card">
        <div class="card-title">
          <span>✈️ Flight Schedule & Fare Configuration</span>
        </div>
        <p class="card-subtitle">
          Register & update flight routes, departure/arrival times, schedule dates, and seat class fares (Rupees &#8377;).
        </p>

        <div *ngIf="successMsg" class="alert alert-success">
          ✅ {{ successMsg }}
        </div>

        <div *ngIf="serverError || flightForm.errors" class="alert alert-danger">
          <div *ngIf="serverError">❌ {{ serverError }}</div>
          <div *ngIf="flightForm.errors?.['sameRoute']">
            ⚠️ Origin and Destination cities must be different.
          </div>
          <div *ngIf="flightForm.errors?.['businessFareInvalid']">
            ⚠️ Business Class Fare MUST be greater than Economy Class Fare.
          </div>
          <div *ngIf="flightForm.errors?.['executiveFareInvalid']">
            ⚠️ Executive Class Fare MUST be greater than Business Class Fare.
          </div>
          <div *ngIf="flightForm.errors?.['capacityHierarchyInvalid']">
            ⚠️ Seat Capacity Hierarchy Error: Economy Seats &gt; Business Seats &gt; Executive Seats is required.
          </div>
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
              <label class="form-label">Origin Airport City <span class="required">*</span></label>
              <select formControlName="origin" (change)="onOriginChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('origin') }">
                <option *ngFor="let city of originCities" [value]="city">{{ city }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Destination Airport City <span class="required">*</span></label>
              <select formControlName="destination" (change)="onDestinationChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('destination') || flightForm.errors?.['sameRoute'] }">
                <option *ngFor="let city of destinationCities" [value]="city">{{ city }}</option>
              </select>
              <div *ngIf="flightForm.errors?.['sameRoute']" class="invalid-feedback">
                Origin and Destination cities must be different.
              </div>
            </div>
          </div>

          <!-- Schedule Date & Timings -->
          <div class="section-divider">Flight Schedule Date & Timings</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Schedule Date <span class="required">*</span></label>
              <input
                type="date"
                formControlName="scheduleDate"
                [min]="todayDate"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('scheduleDate') }"
              />
              <div *ngIf="isFieldInvalid('scheduleDate')" class="invalid-feedback">
                Mandatory schedule date required (today or future date).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Departure Time <span class="required">*</span></label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="text"
                  formControlName="departureTime"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('departureTime') }"
                  placeholder="e.g. 10:30"
                />
                <select formControlName="departurePeriod" class="form-select" style="width: 100px;">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div *ngIf="isFieldInvalid('departureTime')" class="invalid-feedback">
                Departure time is required (hh:mm).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Arrival Time <span class="required">*</span></label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="text"
                  formControlName="arrivalTime"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('arrivalTime') }"
                  placeholder="e.g. 01:45"
                />
                <select formControlName="arrivalPeriod" class="form-select" style="width: 100px;">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div *ngIf="isFieldInvalid('arrivalTime')" class="invalid-feedback">
                Arrival time is required (hh:mm).
              </div>
            </div>
          </div>

          <!-- Class Fares Verification (Rupees ₹ strictly < 10 Lakhs) -->
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
                placeholder="e.g. 5000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('economyClassFare')" class="invalid-feedback">
                Economy fare must be between &#8377;1 and &#8377;9,99,999.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Business Class Fare (&#8377;) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="businessClassFare"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('businessClassFare') || flightForm.errors?.['businessFareInvalid'] }"
                placeholder="e.g. 10000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('businessClassFare')" class="invalid-feedback">
                Business fare must be between &#8377;1 and &#8377;9,99,999.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Executive Class Fare (&#8377;) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="executiveClassFare"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('executiveClassFare') || flightForm.errors?.['executiveFareInvalid'] }"
                placeholder="e.g. 15000"
                min="1" max="999999"
              />
              <div *ngIf="isFieldInvalid('executiveClassFare')" class="invalid-feedback">
                Executive fare must be between &#8377;1 and &#8377;9,99,999.
              </div>
            </div>
          </div>

          <!-- Seat Capacity Inventory (Economy > Business > Executive, 1 to 1000) -->
          <div class="section-divider">Seat Capacity Inventory (1 to 1000: Economy &gt; Business &gt; Executive)</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Economy Class Seats (1-1000) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityEconomyClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityEconomyClass') }"
                placeholder="e.g. 150"
                min="1" max="1000"
              />
              <div *ngIf="isFieldInvalid('seatCapacityEconomyClass')" class="invalid-feedback">
                Capacity must be between 1 and 1000.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Business Class Seats (1-1000) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityBusinessClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityBusinessClass') }"
                placeholder="e.g. 30"
                min="1" max="1000"
              />
              <div *ngIf="isFieldInvalid('seatCapacityBusinessClass')" class="invalid-feedback">
                Capacity must be between 1 and 1000.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Executive Class Seats (1-1000) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="seatCapacityExecutiveClass"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('seatCapacityExecutiveClass') }"
                placeholder="e.g. 15"
                min="1" max="1000"
              />
              <div *ngIf="isFieldInvalid('seatCapacityExecutiveClass')" class="invalid-feedback">
                Capacity must be between 1 and 1000.
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

  allCities = MAJOR_AIRPORTS;
  originCities: string[] = [];
  destinationCities: string[] = [];

  todayDate = new Date().toISOString().split('T')[0];

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
        destination: ['Delhi (DEL)', [Validators.required]],
        scheduleDate: [this.todayDate, [Validators.required]],
        departureTime: ['10:30', [Validators.required, Validators.pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/)]],
        departurePeriod: ['AM', [Validators.required]],
        arrivalTime: ['01:45', [Validators.required, Validators.pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/)]],
        arrivalPeriod: ['PM', [Validators.required]],
        economyClassFare: [5000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        businessClassFare: [10000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        executiveClassFare: [15000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        seatCapacityEconomyClass: [150, [Validators.required, Validators.min(1), Validators.max(1000)]],
        seatCapacityBusinessClass: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
        seatCapacityExecutiveClass: [15, [Validators.required, Validators.min(1), Validators.max(1000)]]
      },
      { validators: [this.originDestinationValidator, this.fareVerificationValidator, this.capacityHierarchyValidator] }
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
        let depTime = f.departureTime || '10:30 AM';
        let arrTime = f.arrivalTime || '01:45 PM';

        let depP = 'AM';
        let arrP = 'PM';

        if (depTime.includes('PM')) { depP = 'PM'; depTime = depTime.replace('PM', '').trim(); }
        else if (depTime.includes('AM')) { depP = 'AM'; depTime = depTime.replace('AM', '').trim(); }

        if (arrTime.includes('PM')) { arrP = 'PM'; arrTime = arrTime.replace('PM', '').trim(); }
        else if (arrTime.includes('AM')) { arrP = 'AM'; arrTime = arrTime.replace('AM', '').trim(); }

        this.flightForm.patchValue({
          ...f,
          departureTime: depTime,
          departurePeriod: depP,
          arrivalTime: arrTime,
          arrivalPeriod: arrP
        });
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
  }

  onDestinationChanged(): void {
    this.updateCityLists();
    if (this.flightForm.value.origin === this.flightForm.value.destination) {
      if (this.originCities.length > 0) {
        this.flightForm.patchValue({ origin: this.originCities[0] });
      }
    }
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

  capacityHierarchyValidator(control: AbstractControl): ValidationErrors | null {
    const eco = Number(control.get('seatCapacityEconomyClass')?.value) || 0;
    const bus = Number(control.get('seatCapacityBusinessClass')?.value) || 0;
    const exe = Number(control.get('seatCapacityExecutiveClass')?.value) || 0;

    if (eco <= bus || bus <= exe) {
      return { capacityHierarchyInvalid: true };
    }
    return null;
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

    const formattedDepTime = `${formVal.departureTime.trim()} ${formVal.departurePeriod}`;
    const formattedArrTime = `${formVal.arrivalTime.trim()} ${formVal.arrivalPeriod}`;

    const flightData: Flight = {
      carrierId: +formVal.carrierId,
      carrierName: carrierName,
      origin: formVal.origin,
      destination: formVal.destination,
      departureTime: formattedDepTime,
      arrivalTime: formattedArrTime,
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
