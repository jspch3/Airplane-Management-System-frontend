import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';

@Component({
  selector: 'app-carrier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="max-width: 960px; margin: 0 auto; padding: 12px 0;">
      <div class="card" style="padding: 44px; border-radius: 24px; box-shadow: var(--shadow-card);">
        
        <!-- Header Bar with Back Button -->
        <div style="margin-bottom: 32px; border-bottom: 1.5px solid var(--gray-200); padding-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <div class="card-title" style="font-size: 1.7rem; margin-bottom: 8px;">
              <span>{{ isEditMode ? '✏️ Edit Carrier Details & Business Rules' : '➕ Register New Airline Carrier' }}</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              Configure carrier discount tiers, advance booking perks, bulk discounts, and cancellation refund percentages.
            </p>
          </div>

          <div>
            <a routerLink="/admin/carriers" class="btn btn-secondary" style="padding: 10px 20px; font-weight: 700; font-size: 0.9rem;">
              &larr; Back to Carrier Inventory
            </a>
          </div>
        </div>

        <!-- Mandatory Rules Guidelines -->
        <div class="alert alert-info" style="margin-bottom: 32px; flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 800; font-size: 0.95rem;">📌 Mandatory Carrier Configuration Guidelines:</div>
          <ul style="margin-left: 20px; margin-top: 4px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
            <li>30-Day Advance Discount: 0% to 10% maximum</li>
            <li>60-Day Advance Discount: 0% to 15% maximum (must be &gt; 30-day discount)</li>
            <li>90-Day Advance Discount: 0% to 25% maximum (must be &gt; 60-day discount)</li>
            <li>Bulk Booking Discount (&ge;10 Seats): 0% to 25% maximum</li>
            <li>Silver Member Discount: 0% to 15% maximum</li>
            <li>Gold Member Discount: 0% to 20% maximum (must be &gt; Silver discount)</li>
            <li>Platinum Member Discount: 0% to 30% maximum (must be &gt; Gold discount)</li>
            <li>Refund Percentages on Cancellation: 0% to 40% maximum</li>
          </ul>
        </div>

        <div *ngIf="successMsg" class="alert alert-success" style="margin-bottom: 32px;">
          ✅ {{ successMsg }}
        </div>

        <!-- Validation Errors Banner -->
        <div *ngIf="serverError || carrierForm.errors" class="alert alert-danger" style="margin-bottom: 32px; flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 800;">⚠️ Validation Errors Detected:</div>
          <ul style="margin-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
            <li *ngIf="serverError">❌ {{ serverError }}</li>
            <li *ngIf="carrierForm.errors?.['advanceHierarchyError']">
              Advance Discount Hierarchy: 30-Day &lt; 60-Day &lt; 90-Day discount is required.
            </li>
            <li *ngIf="carrierForm.errors?.['tierHierarchyError']">
              Membership Tier Hierarchy: Silver &lt; Gold &lt; Platinum discount is required.
            </li>
            <li *ngIf="carrierForm.errors?.['refundHierarchyError']">
              Refund Tier Hierarchy: &lt;2 Days &lt; 2-10 Days &lt; &ge;20 Days refund is required.
            </li>
          </ul>
        </div>

        <form [formGroup]="carrierForm" (ngSubmit)="onSubmit()">
          <!-- Section 1: Carrier Name & Bulk Discount -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 28px; border-radius: 18px; margin-bottom: 28px;">
            <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              🏢 Basic Carrier Information
            </div>

            <div class="grid-2" style="gap: 24px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Carrier Name (min 2 chars) <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="carrierName"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('carrierName') }"
                  placeholder="e.g. Emirates Airlines"
                />
                <div *ngIf="isFieldInvalid('carrierName')" class="invalid-feedback">
                  <div *ngIf="f['carrierName'].errors?.['required']">Carrier name is required.</div>
                  <div *ngIf="f['carrierName'].errors?.['minlength']">Carrier name must be at least 2 characters long.</div>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Bulk Booking Discount % (&gt;4 Seats, Max 25%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="bulkBookingDiscount"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('bulkBookingDiscount') }"
                  placeholder="e.g. 10.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('bulkBookingDiscount')" class="invalid-feedback">
                  Bulk discount must be between 0% and 25%.
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Advance Booking Discounts -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 28px; border-radius: 18px; margin-bottom: 28px;">
            <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              📅 Advance Booking Discounts (% Off Base Fare)
            </div>

            <div class="grid-3" style="gap: 24px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">30 Days Advance % (Max 10%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="discount30DaysAdvanceBooking"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('discount30DaysAdvanceBooking') }"
                  placeholder="e.g. 5.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('discount30DaysAdvanceBooking')" class="invalid-feedback">
                  Discount must be between 0% and 10%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">60 Days Advance % (Max 15%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="discount60DaysAdvanceBooking"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('discount60DaysAdvanceBooking') }"
                  placeholder="e.g. 10.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('discount60DaysAdvanceBooking')" class="invalid-feedback">
                  Discount must be between 0% and 15%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">90 Days Advance % (Max 25%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="discount90DaysAdvanceBooking"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('discount90DaysAdvanceBooking') }"
                  placeholder="e.g. 15.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('discount90DaysAdvanceBooking')" class="invalid-feedback">
                  Discount must be between 0% and 25%.
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Customer Membership Tier Discounts -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 28px; border-radius: 18px; margin-bottom: 28px;">
            <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              ⭐ Customer Membership Tier Discounts (% Off Base Fare)
            </div>

            <div class="grid-3" style="gap: 24px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Silver Member % (Max 15%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="silverUserDiscount"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('silverUserDiscount') }"
                  placeholder="e.g. 5.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('silverUserDiscount')" class="invalid-feedback">
                  Discount must be between 0% and 15%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Gold Member % (Max 20%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="goldUserDiscount"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('goldUserDiscount') }"
                  placeholder="e.g. 10.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('goldUserDiscount')" class="invalid-feedback">
                  Discount must be between 0% and 20%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Platinum Member % (Max 30%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="platinumUserDiscount"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('platinumUserDiscount') }"
                  placeholder="e.g. 15.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('platinumUserDiscount')" class="invalid-feedback">
                  Discount must be between 0% and 30%.
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Cancellation Refund Rules -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 28px; border-radius: 18px; margin-bottom: 36px;">
            <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              🚫 Cancellation Refund Rules (% Refunded to Customer)
            </div>

            <div class="grid-3" style="gap: 24px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">&lt; 2 Days Prior Refund % (Max 20%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="refund2DaysPrior"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('refund2DaysPrior') }"
                  placeholder="e.g. 20.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('refund2DaysPrior')" class="invalid-feedback">
                  Percentage must be between 0% and 20%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">2 to 19 Days Prior Refund % (Max 40%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="refund10DaysPrior"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('refund10DaysPrior') }"
                  placeholder="e.g. 40.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('refund10DaysPrior')" class="invalid-feedback">
                  Percentage must be between 0% and 40%.
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">&ge; 20 Days Prior Refund % (Max 75%) <span class="required">*</span></label>
                <input
                  type="number"
                  formControlName="refund20DaysPrior"
                  class="form-control"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('refund20DaysPrior') }"
                  placeholder="e.g. 75.0"
                  step="0.1"
                />
                <div *ngIf="isFieldInvalid('refund20DaysPrior')" class="invalid-feedback">
                  Percentage must be between 0% and 75%.
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div style="margin-top: 36px; display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid var(--gray-200); padding-top: 24px;">
            <a routerLink="/admin/carriers" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
              &larr; Back to Carrier Inventory
            </a>
            <button type="submit" class="btn btn-primary" style="padding: 14px 28px; font-size: 1.02rem; font-weight: 800;" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting">Saving Carrier Rules...</span>
              <span *ngIf="!isSubmitting">{{ isEditMode ? 'Update Carrier Details &rarr;' : 'Save & Register New Carrier &rarr;' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CarrierFormComponent implements OnInit {
  carrierForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  carrierId: number | null = null;

  successMsg = '';
  serverError = '';

  constructor(
    private fb: FormBuilder,
    private carrierService: CarrierService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.carrierForm = this.fb.group(
      {
        carrierName: ['', [Validators.required, Validators.minLength(2)]],
        discount30DaysAdvanceBooking: [5.0, [Validators.required, Validators.min(0), Validators.max(10)]],
        discount60DaysAdvanceBooking: [10.0, [Validators.required, Validators.min(0), Validators.max(15)]],
        discount90DaysAdvanceBooking: [15.0, [Validators.required, Validators.min(0), Validators.max(25)]],
        bulkBookingDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(25)]],
        refund2DaysPrior: [20.0, [Validators.required, Validators.min(0), Validators.max(20)]],
        refund10DaysPrior: [40.0, [Validators.required, Validators.min(0), Validators.max(40)]],
        refund20DaysPrior: [75.0, [Validators.required, Validators.min(0), Validators.max(75)]],
        silverUserDiscount: [5.0, [Validators.required, Validators.min(0), Validators.max(15)]],
        goldUserDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(20)]],
        platinumUserDiscount: [15.0, [Validators.required, Validators.min(0), Validators.max(30)]]
      },
      { validators: [this.hierarchyValidator] }
    );
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.params['id'];
    if (paramId) {
      this.isEditMode = true;
      this.carrierId = +paramId;
      this.carrierService.getCarrierById(this.carrierId).subscribe({
        next: (c: Carrier) => {
          this.carrierForm.patchValue({
            carrierName: c.carrierName,
            discount30DaysAdvanceBooking: c.discount30DaysAdvanceBooking,
            discount60DaysAdvanceBooking: c.discount60DaysAdvanceBooking,
            discount90DaysAdvanceBooking: c.discount90DaysAdvanceBooking,
            bulkBookingDiscount: c.bulkBookingDiscount,
            refund2DaysPrior: c.refund2DaysBeforeTravelDate,
            refund10DaysPrior: c.refund10DaysBeforeTravelDate,
            refund20DaysPrior: c.refund20DaysOrMoreBeforeTravelDate,
            silverUserDiscount: c.silverUserDiscount,
            goldUserDiscount: c.goldUserDiscount,
            platinumUserDiscount: c.platinumUserDiscount
          });
        },
        error: (err: any) => {
          this.serverError = 'Carrier details not found.';
        }
      });
    }
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

  hierarchyValidator(group: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};

    const d30 = Number(group.get('discount30DaysAdvanceBooking')?.value);
    const d60 = Number(group.get('discount60DaysAdvanceBooking')?.value);
    const d90 = Number(group.get('discount90DaysAdvanceBooking')?.value);

    if (d30 >= d60 || d60 >= d90) {
      errors['advanceHierarchyError'] = true;
    }

    const silver = Number(group.get('silverUserDiscount')?.value);
    const gold = Number(group.get('goldUserDiscount')?.value);
    const plat = Number(group.get('platinumUserDiscount')?.value);

    if (silver >= gold || gold >= plat) {
      errors['tierHierarchyError'] = true;
    }

    const r2 = Number(group.get('refund2DaysPrior')?.value);
    const r10 = Number(group.get('refund10DaysPrior')?.value);
    const r20 = Number(group.get('refund20DaysPrior')?.value);

    if (r2 >= r10 || r10 >= r20) {
      errors['refundHierarchyError'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  onSubmit(): void {
    this.successMsg = '';
    this.serverError = '';

    if (this.carrierForm.invalid) {
      this.carrierForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.carrierForm.value;

    const carrierPayload: Carrier = {
      carrierName: formVal.carrierName,
      discount30DaysAdvanceBooking: formVal.discount30DaysAdvanceBooking,
      discount60DaysAdvanceBooking: formVal.discount60DaysAdvanceBooking,
      discount90DaysAdvanceBooking: formVal.discount90DaysAdvanceBooking,
      bulkBookingDiscount: formVal.bulkBookingDiscount,
      refund2DaysBeforeTravelDate: formVal.refund2DaysPrior,
      refund10DaysBeforeTravelDate: formVal.refund10DaysPrior,
      refund20DaysOrMoreBeforeTravelDate: formVal.refund20DaysPrior,
      silverUserDiscount: formVal.silverUserDiscount,
      goldUserDiscount: formVal.goldUserDiscount,
      platinumUserDiscount: formVal.platinumUserDiscount
    };

    if (this.isEditMode && this.carrierId) {
      this.carrierService.updateCarrier(this.carrierId, carrierPayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMsg = `Carrier '${res.carrierName}' (#CAR-${res.carrierId}) updated successfully!`;
          setTimeout(() => this.router.navigate(['/admin/carriers']), 1200);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.serverError = err.error?.message || 'Failed to update carrier rules.';
        }
      });
    } else {
      this.carrierService.registerCarrier(carrierPayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMsg = `Carrier '${res.carrierName}' registered successfully!`;
          setTimeout(() => this.router.navigate(['/admin/carriers']), 1200);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.serverError = err.error?.message || 'Failed to register carrier. Please check input parameters.';
        }
      });
    }
  }
}
