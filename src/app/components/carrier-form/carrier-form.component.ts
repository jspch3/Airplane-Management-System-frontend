import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';

@Component({
  selector: 'app-carrier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width: 900px; margin: 0 auto;">
      <div class="card">
        <div style="margin-bottom: 16px;">
          <div class="card-title">
            <span>⚙️ Carrier Configuration & Rules [US003 / US004]</span>
          </div>
        </div>
        <p class="card-subtitle">
          Register & update carrier discount tiers, advance booking perks, bulk discounts, and cancellation refund percentages.
        </p>

        <div *ngIf="successMsg" class="alert alert-success">
          ✅ {{ successMsg }}
        </div>

        <div *ngIf="serverError" class="alert alert-danger">
          ❌ {{ serverError }}
        </div>

        <form [formGroup]="carrierForm" (ngSubmit)="onSubmit()">
          <!-- Carrier Name & Bulk Discount -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Carrier Name <span class="required">*</span></label>
              <input
                type="text"
                formControlName="carrierName"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('carrierName') }"
                placeholder="e.g. Emirates Airlines"
              />
              <div *ngIf="isFieldInvalid('carrierName')" class="invalid-feedback">
                <div *ngIf="f['carrierName'].errors?.['required']">Carrier name is required.</div>
                <div *ngIf="f['carrierName'].errors?.['pattern']">
                  Carrier name cannot contain double spaces or invalid characters (Max 50 chars).
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Bulk Booking Discount % (&ge;10 Seats) <span class="required">*</span></label>
              <input
                type="number"
                formControlName="bulkBookingDiscount"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('bulkBookingDiscount') }"
                placeholder="e.g. 15.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('bulkBookingDiscount')" class="invalid-feedback">
                Bulk booking discount must be a percentage between 0 and 100.
              </div>
            </div>
          </div>

          <!-- Advance Booking Discounts (30, 60, 90 Days) -->
          <div class="section-divider">Advance Booking Discounts (% Off Base Fare)</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">30 Days Advance % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="discount30DaysAdvanceBooking"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('discount30DaysAdvanceBooking') }"
                placeholder="e.g. 5.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('discount30DaysAdvanceBooking')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">60 Days Advance % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="discount60DaysAdvanceBooking"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('discount60DaysAdvanceBooking') }"
                placeholder="e.g. 10.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('discount60DaysAdvanceBooking')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">90 Days Advance % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="discount90DaysAdvanceBooking"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('discount90DaysAdvanceBooking') }"
                placeholder="e.g. 15.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('discount90DaysAdvanceBooking')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>
          </div>

          <!-- Customer Tier Discounts (Silver, Gold, Platinum) -->
          <div class="section-divider">Customer Tier Member Discounts (% Off Base Fare)</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Silver Member Discount % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="silverUserDiscount"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('silverUserDiscount') }"
                placeholder="e.g. 5.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('silverUserDiscount')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Gold Member Discount % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="goldUserDiscount"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('goldUserDiscount') }"
                placeholder="e.g. 10.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('goldUserDiscount')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Platinum Member Discount % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="platinumUserDiscount"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('platinumUserDiscount') }"
                placeholder="e.g. 15.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('platinumUserDiscount')" class="invalid-feedback">
                Discount must be between 0 and 100%.
              </div>
            </div>
          </div>

          <!-- Refund Percentage Rules on Cancellation -->
          <div class="section-divider">Cancellation Refund Rules (% Refunded to Customer)</div>
          <hr class="hr-rule" />

          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">&lt; 2 Days Prior Refund % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="refund2DaysPrior"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('refund2DaysPrior') }"
                placeholder="e.g. 20.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('refund2DaysPrior')" class="invalid-feedback">
                Percentage must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">2 to 10 Days Prior Refund % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="refund10DaysPrior"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('refund10DaysPrior') }"
                placeholder="e.g. 50.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('refund10DaysPrior')" class="invalid-feedback">
                Percentage must be between 0 and 100%.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">&ge; 20 Days Prior Refund % <span class="required">*</span></label>
              <input
                type="number"
                formControlName="refund20DaysPrior"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('refund20DaysPrior') }"
                placeholder="e.g. 80.0"
                step="0.1"
              />
              <div *ngIf="isFieldInvalid('refund20DaysPrior')" class="invalid-feedback">
                Percentage must be between 0 and 100%.
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" (click)="goBack()" class="btn btn-secondary">
              &larr; Back to Previous Page
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting">Saving Carrier...</span>
              <span *ngIf="!isSubmitting">Save & Register Carrier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CarrierFormComponent {
  carrierForm: FormGroup;
  isSubmitting = false;
  successMsg = '';
  serverError = '';

  constructor(private fb: FormBuilder, private carrierService: CarrierService, private location: Location) {
    this.carrierForm = this.fb.group({
      carrierName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$/)]],
      discount30DaysAdvanceBooking: [5.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      discount60DaysAdvanceBooking: [10.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      discount90DaysAdvanceBooking: [15.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      bulkBookingDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      refund2DaysPrior: [20.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      refund10DaysPrior: [50.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      refund20DaysPrior: [80.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      silverUserDiscount: [5.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      goldUserDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      platinumUserDiscount: [15.0, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  goBack(): void {
    this.location.back();
  }

  get f() {
    return this.carrierForm.controls;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.carrierForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    this.successMsg = '';
    this.serverError = '';

    if (this.carrierForm.invalid) {
      this.carrierForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const carrierData: Carrier = {
      carrierName: this.carrierForm.value.carrierName.trim(),
      discount30DaysAdvanceBooking: Number(this.carrierForm.value.discount30DaysAdvanceBooking),
      discount60DaysAdvanceBooking: Number(this.carrierForm.value.discount60DaysAdvanceBooking),
      discount90DaysAdvanceBooking: Number(this.carrierForm.value.discount90DaysAdvanceBooking),
      bulkBookingDiscount: Number(this.carrierForm.value.bulkBookingDiscount),
      refund2DaysBeforeTravelDate: Number(this.carrierForm.value.refund2DaysPrior),
      refund10DaysBeforeTravelDate: Number(this.carrierForm.value.refund10DaysPrior),
      refund20DaysOrMoreBeforeTravelDate: Number(this.carrierForm.value.refund20DaysPrior),
      silverUserDiscount: Number(this.carrierForm.value.silverUserDiscount),
      goldUserDiscount: Number(this.carrierForm.value.goldUserDiscount),
      platinumUserDiscount: Number(this.carrierForm.value.platinumUserDiscount)
    };

    this.carrierService.registerCarrier(carrierData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMsg = `Carrier '${res.carrierName}' registered successfully with ID #${res.carrierId}!`;
        this.carrierForm.reset({
          discount30DaysAdvanceBooking: 5.0,
          discount60DaysAdvanceBooking: 10.0,
          discount90DaysAdvanceBooking: 15.0,
          bulkBookingDiscount: 10.0,
          refund2DaysPrior: 20.0,
          refund10DaysPrior: 50.0,
          refund20DaysPrior: 80.0,
          silverUserDiscount: 5.0,
          goldUserDiscount: 10.0,
          platinumUserDiscount: 15.0
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError = err.error?.message || 'Carrier registration failed.';
      }
    });
  }
}
