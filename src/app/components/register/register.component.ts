import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { INDIAN_STATES, lookupPincode } from '../../constants/location.data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="max-width: 860px; margin: 0 auto;">
      <div class="card">
        <div style="margin-bottom: 16px;">
          <div class="card-title">
            <span>👤 Customer Account Registration</span>
          </div>
        </div>
        <p class="card-subtitle">
          Fill in your passenger details below. Registration is open to customers aged 18 to 120 years.
        </p>

        <!-- Line-by-Line Registration Rules Info Banner (Pincode instruction removed) -->
        <div class="alert alert-info" style="margin-bottom: 32px; flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
            <span>ℹ️</span> Customer Account Registration Instructions & Rules:
          </div>
          <ul style="margin-left: 24px; margin-top: 4px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
            <li>Passenger age must be between <strong>18 and 120 years</strong>.</li>
            <li>Mobile phone number must be 10 digits starting with <strong>6, 7, 8, or 9</strong>.</li>
            <li>Username, Mobile Number, and Email ID must be strictly unique across system accounts.</li>
            <li>Password must contain at least 8 characters with uppercase, lowercase, digit, and special symbol (&#64;$!%*?&amp;).</li>
          </ul>
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          ✅ {{ successMessage }}
        </div>

        <div *ngIf="serverError" class="alert alert-danger">
          ❌ {{ serverError }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Full Name & Phone Number -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input
                type="text"
                formControlName="fullName"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('fullName'), 'is-valid': isFieldValid('fullName') }"
                placeholder="e.g. Sarah Connor (min 2 alphabetic characters)"
              />
              <div *ngIf="isFieldInvalid('fullName')" class="invalid-feedback">
                <div *ngIf="f['fullName'].errors?.['required']">Full Name is required.</div>
                <div *ngIf="f['fullName'].errors?.['pattern']">
                  Name must contain at least 2 alphabetic characters with single spaces between words.
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number <span class="required">*</span></label>
              <input
                type="tel"
                inputmode="numeric"
                formControlName="phone"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('phone'), 'is-valid': isFieldValid('phone') }"
                placeholder="10 digits starting with 6-9 (e.g. 9876543210)"
              />
              <div *ngIf="isFieldInvalid('phone')" class="invalid-feedback">
                <div *ngIf="f['phone'].errors?.['required']">Phone number is required.</div>
                <div *ngIf="f['phone'].errors?.['pattern']">
                  Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits.
                </div>
              </div>
            </div>
          </div>

          <!-- Username, Password & Confirm Password -->
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Username <span class="required">*</span></label>
              <input
                type="text"
                formControlName="userName"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('userName'), 'is-valid': isFieldValid('userName') }"
                placeholder="e.g. sarah123"
              />
              <div *ngIf="isFieldInvalid('userName')" class="invalid-feedback">
                <div *ngIf="f['userName'].errors?.['required']">Username is required.</div>
                <div *ngIf="f['userName'].errors?.['pattern']">
                  Username must be 4-30 alphanumeric characters (symbols and underscores-only are rejected).
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <input
                type="password"
                formControlName="password"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('password'), 'is-valid': isFieldValid('password') }"
                placeholder="••••••••"
              />
              <div *ngIf="isFieldInvalid('password')" class="invalid-feedback">
                <div *ngIf="f['password'].errors?.['required']">Password is required.</div>
                <div *ngIf="f['password'].errors?.['pattern']">
                  Min 8 chars with 1 uppercase, 1 lowercase, 1 digit, and 1 special char (&#64;$!%*?&).
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password <span class="required">*</span></label>
              <input
                type="password"
                formControlName="confirmPassword"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch'], 'is-valid': isFieldValid('confirmPassword') }"
                placeholder="••••••••"
              />
              <div *ngIf="isFieldInvalid('confirmPassword') || (f['confirmPassword'].touched && registerForm.errors?.['passwordMismatch'])" class="invalid-feedback">
                <div *ngIf="f['confirmPassword'].errors?.['required']">Please confirm your password.</div>
                <div *ngIf="registerForm.errors?.['passwordMismatch']">Passwords do not match.</div>
              </div>
            </div>
          </div>

          <!-- Customer Category & Email ID -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Customer Membership Tier <span class="required">*</span></label>
              <select formControlName="customerCategory" class="form-select">
                <option value="REGULAR">Regular Tier (Standard Fares)</option>
                <option value="SILVER">Silver Member (5% Tier Discount)</option>
                <option value="GOLD">Gold Member (10% Tier Discount)</option>
                <option value="PLATINUM">Platinum VIP (15% Tier Discount)</option>
              </select>
            </div>

            <!-- Email Prefix + Domain Dropdown -->
            <div class="form-group">
              <label class="form-label">Email ID <span class="required">*</span></label>
              <div class="email-input-group">
                <input
                  type="text"
                  formControlName="emailPrefix"
                  class="form-control email-prefix-input"
                  [ngClass]="{ 'is-invalid': isFieldInvalid('emailPrefix') }"
                  placeholder="prefix"
                />
                <span class="email-at-symbol">&#64;</span>
                <select formControlName="emailDomain" class="form-select email-domain-select">
                  <option value="gmail.com">gmail.com</option>
                  <option value="yahoo.com">yahoo.com</option>
                  <option value="outlook.com">outlook.com</option>
                  <option value="hotmail.com">hotmail.com</option>
                  <option value="icloud.com">icloud.com</option>
                </select>
              </div>
              <div *ngIf="isFieldInvalid('emailPrefix')" class="invalid-feedback">
                Valid email prefix required before &#64;.
              </div>
            </div>
          </div>

          <!-- Address 1 & Address 2 -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Address Line 1 (5-100 chars) <span class="required">*</span></label>
              <input
                type="text"
                formControlName="address1"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('address1'), 'is-valid': isFieldValid('address1') }"
                placeholder="e.g. St. Martin's Road, Suite 40"
              />
              <div *ngIf="isFieldInvalid('address1')" class="invalid-feedback">
                <div *ngIf="f['address1'].errors?.['required']">Address line 1 is required.</div>
                <div *ngIf="f['address1'].errors?.['minlength']">Address line 1 must be at least 5 characters.</div>
                <div *ngIf="f['address1'].errors?.['maxlength']">Address line 1 cannot exceed 100 characters.</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address Line 2 (Optional, max 100 chars)</label>
              <input
                type="text"
                formControlName="address2"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('address2') }"
                placeholder="Apt / Suite / Landmark"
              />
              <div *ngIf="isFieldInvalid('address2')" class="invalid-feedback">
                <div *ngIf="f['address2'].errors?.['maxlength']">Address line 2 cannot exceed 100 characters.</div>
              </div>
            </div>
          </div>

          <!-- City, State, Zip & DOB with >=18 and <=120 Age Check -->
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label">Zip Code (6 Digits) <span class="required">*</span></label>
              <input
                type="text"
                inputmode="numeric"
                formControlName="zipCode"
                class="form-control"
                (input)="onZipCodeInput()"
                [ngClass]="{ 'is-invalid': isFieldInvalid('zipCode'), 'is-valid': isFieldValid('zipCode') }"
                placeholder="e.g. 400001"
              />
              <div *ngIf="isFieldInvalid('zipCode')" class="invalid-feedback">
                Zip code must be a 6-digit Indian PIN code.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">State <span class="required">*</span></label>
              <select
                formControlName="state"
                class="form-select"
                [ngClass]="{ 'is-invalid': isFieldInvalid('state'), 'is-valid': isFieldValid('state') }"
              >
                <option value="">Select State / UT</option>
                <option *ngFor="let st of indianStates" [value]="st">{{ st }}</option>
              </select>
              <div *ngIf="isFieldInvalid('state')" class="invalid-feedback">
                Please select a valid Indian State/UT.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">City <span class="required">*</span></label>
              <input
                type="text"
                formControlName="city"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('city'), 'is-valid': isFieldValid('city') }"
                placeholder="e.g. Mumbai (min 3 chars)"
              />
              <div *ngIf="isFieldInvalid('city')" class="invalid-feedback">
                City is required (at least 3 alphabetic characters).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth (18-120 yrs) <span class="required">*</span></label>
              <input
                type="date"
                formControlName="dob"
                [min]="minDobDate"
                [max]="maxDobDate"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('dob'), 'is-valid': isFieldValid('dob') }"
              />
              <div *ngIf="isFieldInvalid('dob')" class="invalid-feedback">
                <div *ngIf="f['dob'].errors?.['required']">Date of birth is required.</div>
                <div *ngIf="f['dob'].errors?.['ageRange']">User age must be strictly between 18 and 120 years.</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; align-items: center; justify-content: space-between;">
            <button type="submit" class="btn btn-primary" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting">Registering Account...</span>
              <span *ngIf="!isSubmitting">Complete Account Registration</span>
            </button>
            <a routerLink="/login" style="color: var(--sky-blue); text-decoration: none; font-size: 0.95rem; font-weight: 500;">
              Already registered? Sign In &rarr;
            </a>
          </div>
        </form>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <button type="button" (click)="goBack()" class="btn btn-secondary">
          &larr; Back to Previous Page
        </button>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
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

    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]{2,}( [a-zA-Z]+)*$/)]],
        userName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{4,30}$/)]],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ]
        ],
        confirmPassword: ['', [Validators.required]],
        role: ['CUSTOMER', [Validators.required]],
        customerCategory: ['REGULAR', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
        emailPrefix: ['', [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._%+-]*$/)]],
        emailDomain: ['gmail.com', [Validators.required]],
        address1: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        address2: ['', [Validators.maxLength(100)]],
        city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]{3,50}$/)]],
        state: ['', [Validators.required]],
        zipCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
        dob: ['', [Validators.required, this.ageRangeValidator(18, 120)]]
      },
      { validators: [this.passwordMatchValidator] }
    );
  }

  ngOnInit(): void {}

  get f() {
    return this.registerForm.controls;
  }

  goBack(): void {
    this.location.back();
  }

  onZipCodeInput(): void {
    const code = this.registerForm.get('zipCode')?.value;
    if (code && code.length === 6) {
      const loc = lookupPincode(code);
      if (loc) {
        this.registerForm.patchValue({
          city: loc.city,
          state: loc.state
        });
      }
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isFieldValid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.valid && (control.dirty || control.touched));
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

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    if (confirmPassword.value && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    this.successMessage = '';
    this.serverError = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.registerForm.value;
    const fullEmail = `${formVal.emailPrefix.trim()}@${formVal.emailDomain}`;

    const userData: User = {
      userName: formVal.userName.trim(),
      password: formVal.password,
      role: 'CUSTOMER',
      customerCategory: formVal.customerCategory,
      phone: formVal.phone.trim(),
      emailId: fullEmail,
      address1: formVal.address1.trim(),
      address2: formVal.address2?.trim(),
      city: formVal.city.trim(),
      state: formVal.state.trim(),
      zipCode: formVal.zipCode.trim(),
      dob: formVal.dob
    };

    this.authService.registerUser(userData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = `Account '${res.userName}' registered successfully! Redirecting to login...`;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError = err.error?.message || 'Username or Email ID is already taken.';
      }
    });
  }
}
