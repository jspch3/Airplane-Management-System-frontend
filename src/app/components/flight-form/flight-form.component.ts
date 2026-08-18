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
          <div *ngIf="flightForm.errors?.['pastDepartureTime']">
            ⚠️ Departure time cannot be earlier than current local time for today's flight schedule.
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
              <select formControlName="origin" (change)="onRouteOrTimeChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('origin') }">
                <option *ngFor="let city of originCities" [value]="city">{{ city }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Destination Airport City <span class="required">*</span></label>
              <select formControlName="destination" (change)="onRouteOrTimeChanged()" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('destination') || flightForm.errors?.['sameRoute'] }">
                <option *ngFor="let city of destinationCities" [value]="city">{{ city }}</option>
              </select>
              <div *ngIf="flightForm.errors?.['sameRoute']" class="invalid-feedback">
                Origin and Destination cities must be different.
              </div>
            </div>
          </div>

          <!-- Schedule Date, Frequency Theme & Distance Timings -->
          <div class="section-divider">Flight Schedule Date, Recurrence Theme & Distance Timings</div>
          <hr class="hr-rule" />

          <div class="grid-4" style="gap: 20px;">
            <div class="form-group">
              <label class="form-label">Schedule Start Date <span class="required">*</span></label>
              <input
                type="date"
                formControlName="scheduleDate"
                [min]="todayDate"
                (change)="onRouteOrTimeChanged()"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('scheduleDate') }"
              />
              <div *ngIf="isFieldInvalid('scheduleDate')" class="invalid-feedback">
                Mandatory schedule date required (today or future date).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Recurrence Theme / Frequency <span class="required">*</span></label>
              <select formControlName="flightFrequency" class="form-select">
                <option value="SINGLE_DATE">📅 Single Date Only (One-Time Flight)</option>
                <option value="DAILY">🗓️ Daily (Every Day)</option>
                <option value="EVERY_3_DAYS">🗓️ Every 3 Days</option>
                <option value="WEEKLY">🗓️ Weekly (Every 7 Days)</option>
                <option value="MONTHLY">🗓️ Monthly (Every Month)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Departure Time <span class="required">*</span></label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="text"
                  formControlName="departureTime"
                  (input)="onRouteOrTimeChanged()"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('departureTime') }"
                  placeholder="e.g. 10:30"
                />
                <select formControlName="departurePeriod" (change)="onRouteOrTimeChanged()" class="form-select" style="width: 100px;">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div *ngIf="isFieldInvalid('departureTime')" class="invalid-feedback">
                Departure time is required (hh:mm).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Calculated Arrival Time <span class="required">*</span></label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="text"
                  formControlName="arrivalTime"
                  class="form-control"
                  readonly
                  style="background: #f1f5f9; cursor: not-allowed;"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('arrivalTime') }"
                  placeholder="Auto calculated"
                />
                <select formControlName="arrivalPeriod" class="form-select" style="width: 100px; pointer-events: none; background: #f1f5f9;">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div *ngIf="isFieldInvalid('arrivalTime')" class="invalid-feedback">
                Arrival time is required.
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
        flightFrequency: ['SINGLE_DATE', [Validators.required]],
        departureTime: ['10:30', [Validators.required, Validators.pattern(/^(0?[1-9]|1[0-2]):[0-5][0-9]$/)]],
        departurePeriod: ['AM', [Validators.required]],
        arrivalTime: ['12:45', [Validators.required]],
        arrivalPeriod: ['PM', [Validators.required]],
        economyClassFare: [5000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        businessClassFare: [10000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        executiveClassFare: [15000, [Validators.required, Validators.min(1), Validators.max(999999)]],
        seatCapacityEconomyClass: [150, [Validators.required, Validators.min(1), Validators.max(1000)]],
        seatCapacityBusinessClass: [30, [Validators.required, Validators.min(1), Validators.max(1000)]],
        seatCapacityExecutiveClass: [15, [Validators.required, Validators.min(1), Validators.max(1000)]]
      },
      { validators: [this.originDestinationValidator, this.fareVerificationValidator, this.capacityHierarchyValidator, this.pastDepartureTimeValidator.bind(this)] }
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
          scheduleDate: f.scheduleDate || this.todayDate,
          flightFrequency: f.flightFrequency || 'SINGLE_DATE',
          departureTime: depTime,
          departurePeriod: depP,
          arrivalTime: arrTime,
          arrivalPeriod: arrP
        });
        this.updateCityLists();
        this.recalculateArrivalTime();
      });
    } else {
      this.recalculateArrivalTime();
    }
  }

  updateCityLists(): void {
    const selectedOrigin = this.flightForm.value.origin;
    const selectedDest = this.flightForm.value.destination;

    this.destinationCities = this.allCities.filter(c => c !== selectedOrigin);
    this.originCities = this.allCities.filter(c => c !== selectedDest);
  }

  onRouteOrTimeChanged(): void {
    this.updateCityLists();
    if (this.flightForm.value.origin === this.flightForm.value.destination) {
      if (this.destinationCities.length > 0) {
        this.flightForm.patchValue({ destination: this.destinationCities[0] });
      }
    }
    this.recalculateArrivalTime();
  }

  recalculateArrivalTime(): void {
    const origin = this.flightForm?.value?.origin || '';
    const dest = this.flightForm?.value?.destination || '';
    const depTimeStr = this.flightForm?.value?.departureTime || '10:30';
    const depPeriod = this.flightForm?.value?.departurePeriod || 'AM';

    const parts = depTimeStr.split(':');
    if (parts.length !== 2) return;

    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return;

    if (depPeriod === 'PM' && hours < 12) hours += 12;
    if (depPeriod === 'AM' && hours === 12) hours = 0;

    // Distance flight duration logic
    let durationMins = 120; // Default 2 hours
    const oClean = origin.replaceAll(/\s*\([^)]*\)/g, '').trim().toUpperCase();
    const dClean = dest.replaceAll(/\s*\([^)]*\)/g, '').trim().toUpperCase();

    if ((oClean === 'MUMBAI' && dClean === 'DELHI') || (oClean === 'DELHI' && dClean === 'MUMBAI')) durationMins = 135;
    else if ((oClean === 'MUMBAI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'MUMBAI')) durationMins = 105;
    else if ((oClean === 'MUMBAI' && dClean === 'HYDERABAD') || (oClean === 'HYDERABAD' && dClean === 'MUMBAI')) durationMins = 85;
    else if ((oClean === 'MUMBAI' && dClean === 'DUBAI') || (oClean === 'DUBAI' && dClean === 'MUMBAI')) durationMins = 210;
    else if ((oClean === 'DELHI' && dClean === 'BENGALURU') || (oClean === 'BENGALURU' && dClean === 'DELHI')) durationMins = 170;
    else if ((oClean === 'DELHI' && dClean === 'LONDON') || (oClean === 'LONDON' && dClean === 'DELHI')) durationMins = 555;
    else if ((oClean === 'VIJAYAWADA' && dClean === 'VISAKHAPATNAM') || (oClean === 'VISAKHAPATNAM' && dClean === 'VIJAYAWADA')) durationMins = 60;

    let totalMins = (hours * 60) + minutes + durationMins;
    totalMins = totalMins % (24 * 60);

    let arrHours24 = Math.floor(totalMins / 60);
    let arrMins = totalMins % 60;

    let arrPeriod = arrHours24 >= 12 ? 'PM' : 'AM';
    let arrHours12 = arrHours24 % 12;
    if (arrHours12 === 0) arrHours12 = 12;

    const formattedArrTime = `${arrHours12.toString().padStart(2, '0')}:${arrMins.toString().padStart(2, '0')}`;

    this.flightForm.patchValue({
      arrivalTime: formattedArrTime,
      arrivalPeriod: arrPeriod
    }, { emitEvent: false });
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

  pastDepartureTimeValidator(control: AbstractControl): ValidationErrors | null {
    const schedDate = control.get('scheduleDate')?.value;
    const depTimeStr = control.get('departureTime')?.value;
    const depPeriod = control.get('departurePeriod')?.value;

    if (!schedDate || !depTimeStr || schedDate !== this.todayDate) {
      return null;
    }

    const parts = depTimeStr.split(':');
    if (parts.length !== 2) return null;

    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;

    if (depPeriod === 'PM' && hours < 12) hours += 12;
    if (depPeriod === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    const currentMins = (now.getHours() * 60) + now.getMinutes();
    const flightDepMins = (hours * 60) + minutes;

    if (flightDepMins < currentMins) {
      return { pastDepartureTime: true };
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
      scheduleDate: formVal.scheduleDate,
      flightFrequency: formVal.flightFrequency || 'SINGLE_DATE',
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
