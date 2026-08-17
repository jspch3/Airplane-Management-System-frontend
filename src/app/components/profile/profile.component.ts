import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, LoginResponse } from '../../models/user.model';
import { INDIAN_STATES, lookupPincode } from '../../constants/location.data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width: 860px; margin: 0 auto;">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">
              <span>👤 Account Profile & Settings</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              View and update your personal details, email, contact phone, and address.
            </p>
          </div>

          <!-- Customer Membership Tier Badge (Hidden for ADMIN) -->
          <div *ngIf="currentUser?.role !== 'ADMIN'">
            <span class="badge" [ngClass]="{
              'badge-silver': currentUser?.customerCategory === 'SILVER',
              'badge-gold': currentUser?.customerCategory === 'GOLD',
              'badge-platinum': currentUser?.customerCategory === 'PLATINUM',
              'badge-secondary': !currentUser?.customerCategory || currentUser?.customerCategory === 'REGULAR'
            }" style="font-size: 0.9rem; padding: 6px 14px; border-radius: 20px;">
              ⭐ {{ currentUser?.customerCategory || 'REGULAR' }} MEMBER
            </span>
          </div>

          <div *ngIf="currentUser?.role === 'ADMIN'">
            <span class="badge" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; font-size: 0.9rem; padding: 6px 14px; border-radius: 20px;">
              🛡️ SYSTEM ADMINISTRATOR
            </span>
          </div>
        </div>

        <div *ngIf="successMsg" class="alert alert-success">
          ✅ {{ successMsg }}
        </div>

        <div *ngIf="serverError" class="alert alert-danger">
          ❌ {{ serverError }}
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <!-- Username & Role (Read-only System Info) -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" formControlName="userName" class="form-control" readonly style="background: var(--gray-100); cursor: not-allowed;" />
            </div>

            <div class="form-group">
              <label class="form-label">Account Role</label>
              <input type="text" formControlName="role" class="form-control" readonly style="background: var(--gray-100); cursor: not-allowed;" />
            </div>
          </div>

          <!-- Email & Phone Number -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Email ID <span class="required">*</span></label>
              <input
                type="email"
                formControlName="emailId"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('emailId') }"
                placeholder="name@domain.com"
              />
              <div *ngIf="isFieldInvalid('emailId')" class="invalid-feedback">
                Please enter a valid email address.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number <span class="required">*</span></label>
              <input
                type="tel"
                inputmode="numeric"
                formControlName="phone"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('phone') }"
                placeholder="10 digits starting with 6-9"
              />
              <div *ngIf="isFieldInvalid('phone')" class="invalid-feedback">
                Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits.
              </div>
            </div>
          </div>

          <!-- Customer Membership Tier (Hidden for ADMIN) -->
          <div class="form-group" *ngIf="currentUser?.role !== 'ADMIN'">
            <label class="form-label">Customer Membership Tier Category</label>
            <select formControlName="customerCategory" class="form-select">
              <option value="REGULAR">Regular Tier (Standard Fares)</option>
              <option value="SILVER">Silver Member (5% Tier Discount)</option>
              <option value="GOLD">Gold Member (10% Tier Discount)</option>
              <option value="PLATINUM">Platinum VIP (15% Tier Discount)</option>
            </select>
          </div>

          <!-- Address Line 1 & Line 2 -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Address Line 1 (5-100 chars) <span class="required">*</span></label>
              <input
                type="text"
                formControlName="address1"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('address1') }"
              />
              <div *ngIf="isFieldInvalid('address1')" class="invalid-feedback">
                <div *ngIf="f['address1'].errors?.['required']">Address line 1 is required.</div>
                <div *ngIf="f['address1'].errors?.['minlength']">Address line 1 must be at least 5 characters.</div>
                <div *ngIf="f['address1'].errors?.['maxlength']">Address line 1 cannot exceed 100 characters.</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address Line 2 (Optional, max 100 chars)</label>
              <input type="text" formControlName="address2" class="form-control" [ngClass]="{ 'is-invalid': isFieldInvalid('address2') }" />
              <div *ngIf="isFieldInvalid('address2')" class="invalid-feedback">
                <div *ngIf="f['address2'].errors?.['maxlength']">Address line 2 cannot exceed 100 characters.</div>
              </div>
            </div>
          </div>

          <!-- City, State, Zip & DOB -->
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label">Zip Code (6 Digits) <span class="required">*</span></label>
              <input
                type="text"
                inputmode="numeric"
                formControlName="zipCode"
                class="form-control"
                (input)="onZipCodeInput()"
                [ngClass]="{ 'is-invalid': isFieldInvalid('zipCode') }"
              />
              <div *ngIf="isFieldInvalid('zipCode')" class="invalid-feedback">Zip Code must be a 6-digit Indian PIN code.</div>
            </div>

            <div class="form-group">
              <label class="form-label">State <span class="required">*</span></label>
              <select formControlName="state" class="form-select" [ngClass]="{ 'is-invalid': isFieldInvalid('state') }">
                <option value="">Select State / UT</option>
                <option *ngFor="let st of indianStates" [value]="st">{{ st }}</option>
              </select>
              <div *ngIf="isFieldInvalid('state')" class="invalid-feedback">Please select a valid Indian State/UT.</div>
            </div>

            <div class="form-group">
              <label class="form-label">City <span class="required">*</span></label>
              <input type="text" formControlName="city" class="form-control" [ngClass]="{ 'is-invalid': isFieldInvalid('city') }" />
              <div *ngIf="isFieldInvalid('city')" class="invalid-feedback">City is required (at least 3 alphabetic characters).</div>
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth (18-120 yrs) <span class="required">*</span></label>
              <input
                type="date"
                formControlName="dob"
                [min]="minDobDate"
                [max]="maxDobDate"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('dob') }"
              />
              <div *ngIf="isFieldInvalid('dob')" class="invalid-feedback">
                <div *ngIf="f['dob'].errors?.['required']">Date of birth is required.</div>
                <div *ngIf="f['dob'].errors?.['ageRange']">User age must be strictly between 18 and 120 years.</div>
              </div>
            </div>
          </div>

          <!-- Action Buttons Layout -->
          <div style="margin-top: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting" style="padding: 12px 24px; font-weight: 800;">
              <span *ngIf="isSubmitting">Saving Changes...</span>
              <span *ngIf="!isSubmitting">💾 Save & Update Profile</span>
            </button>

            <!-- Sign Out Action Relocated Here -->
            <button type="button" (click)="logout()" class="btn btn-danger" style="padding: 12px 24px; font-weight: 700;">
              🚪 Sign Out of Account
            </button>
          </div>
        </form>

        <div style="margin-top: 24px; text-align: center;">
          <button type="button" (click)="goBack()" class="btn btn-secondary">
            &larr; Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: LoginResponse | null = null;
  userProfile: User | null = null;

  isSubmitting = false;
  successMsg = '';
  serverError = '';

  indianStates = INDIAN_STATES;
  minDobDate: string = '';
  maxDobDate: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

    this.maxDobDate = maxDate.toISOString().split('T')[0];
    this.minDobDate = minDate.toISOString().split('T')[0];

    this.profileForm = this.fb.group({
      userName: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],
      customerCategory: ['REGULAR'],
      emailId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
      address1: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      address2: ['', [Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]{3,50}$/)]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
      dob: ['', [Validators.required, this.ageRangeValidator(18, 120)]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u?.userId) {
        this.authService.getUserById(u.userId).subscribe(user => {
          this.userProfile = user;
          this.profileForm.patchValue({
            userName: user.userName,
            role: user.role,
            customerCategory: user.customerCategory || 'REGULAR',
            emailId: user.emailId,
            phone: user.phone,
            address1: user.address1,
            address2: user.address2,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
            dob: user.dob
          });
        });
      }
    });
  }

  get f() {
    return this.profileForm.controls;
  }

  onZipCodeInput(): void {
    const code = this.profileForm.get('zipCode')?.value;
    if (code && code.length === 6) {
      const loc = lookupPincode(code);
      if (loc) {
        this.profileForm.patchValue({
          city: loc.city,
          state: loc.state
        });
      }
    }
  }

  ageRangeValidator(minAge: number, maxAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const dob = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return (age >= minAge && age <= maxAge) ? null : { ageRange: true };
    };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    this.successMsg = '';
    this.serverError = '';
    if (this.profileForm.invalid || !this.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.profileForm.getRawValue();

    this.authService.updateProfile(this.currentUser.userId, formVal).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMsg = 'Profile details updated successfully!';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError = err.error?.message || 'Failed to update profile details.';
      }
    });
  }
}
