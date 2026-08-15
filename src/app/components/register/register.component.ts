import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="max-width: 860px; margin: 0 auto;">
      <div class="card">
        <div style="margin-bottom: 16px;">
          <div class="card-title">
            <span>👤 Customer Account Registration [US001]</span>
          </div>
        </div>
        <p class="card-subtitle">
          Fill in your passenger details below. Registration is open to customers aged 18 years or older.
        </p>

        <!-- Prominent Mobile Info Banner -->
        <div class="info-banner">
          <span>ℹ️</span>
          <div>
            <strong>Registration Rules:</strong> You must be <strong>18 years or older</strong>. Mobile number must be 10 digits starting with <strong>6, 7, 8, or 9</strong>. Zip code must be 6 numeric digits.
          </div>
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
                placeholder="e.g. Sarah Connor"
              />
              <div *ngIf="isFieldInvalid('fullName')" class="invalid-feedback">
                <div *ngIf="f['fullName'].errors?.['required']">Full Name is required.</div>
                <div *ngIf="f['fullName'].errors?.['pattern']">
                  Name must contain letters only with a single space between words.
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number <span class="required">*</span></label>
              <input
                type="text"
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
                placeholder="e.g. sarah_connor"
              />
              <div *ngIf="isFieldInvalid('userName')" class="invalid-feedback">
                <div *ngIf="f['userName'].errors?.['required']">Username is required.</div>
                <div *ngIf="f['userName'].errors?.['pattern']">
                  Username must be 4-30 characters (letters, numbers, underscores only).
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
                placeholder="e.g. 742 Evergreen Terrace"
              />
              <div *ngIf="isFieldInvalid('address1')" class="invalid-feedback">
                <div *ngIf="f['address1'].errors?.['required']">Address line 1 is required.</div>
                <div *ngIf="f['address1'].errors?.['minlength']">Address line 1 must be at least 5 characters.</div>
                <div *ngIf="f['address1'].errors?.['maxlength']">Address line 1 cannot exceed 100 characters.</div>
                <div *ngIf="f['address1'].errors?.['pattern']">Address cannot contain double spaces or invalid symbols.</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address Line 2 (Optional, max 100 chars)</label>
              <input
                type="text"
                formControlName="address2"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('address2') }"
                placeholder="Apt / Suite"
              />
              <div *ngIf="isFieldInvalid('address2')" class="invalid-feedback">
                <div *ngIf="f['address2'].errors?.['maxlength']">Address line 2 cannot exceed 100 characters.</div>
                <div *ngIf="f['address2'].errors?.['pattern']">Address line 2 cannot contain double spaces.</div>
              </div>
            </div>
          </div>

          <!-- City, State, Zip & DOB with >=18 Age Check -->
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label">City <span class="required">*</span></label>
              <input
                type="text"
                formControlName="city"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('city'), 'is-valid': isFieldValid('city') }"
                placeholder="e.g. Chicago"
              />
              <div *ngIf="isFieldInvalid('city')" class="invalid-feedback">
                City is required (letters only, single space).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">State <span class="required">*</span></label>
              <input
                type="text"
                formControlName="state"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('state'), 'is-valid': isFieldValid('state') }"
                placeholder="e.g. Illinois"
              />
              <div *ngIf="isFieldInvalid('state')" class="invalid-feedback">
                State is required (letters only, single space).
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Zip Code (6 Digits) <span class="required">*</span></label>
              <input
                type="text"
                formControlName="zipCode"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('zipCode'), 'is-valid': isFieldValid('zipCode') }"
                placeholder="e.g. 400001"
              />
              <div *ngIf="isFieldInvalid('zipCode')" class="invalid-feedback">
                Zip code must be exactly 6 numeric digits.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Date of Birth (&ge;18 yrs) <span class="required">*</span></label>
              <input
                type="date"
                formControlName="dob"
                class="form-control"
                [ngClass]="{ 'is-invalid': isFieldInvalid('dob'), 'is-valid': isFieldValid('dob') }"
              />
              <div *ngIf="isFieldInvalid('dob')" class="invalid-feedback">
                <div *ngIf="f['dob'].errors?.['required']">Date of birth is required.</div>
                <div *ngIf="f['dob'].errors?.['underAge']">You must be at least 18 years old to register.</div>
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
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  serverError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]],
        userName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{4,30}$/)]],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          ]
        ],
        confirmPassword: ['', [Validators.required]],
        role: ['CUSTOMER', [Validators.required]],
        customerCategory: ['GOLD', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
        emailPrefix: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+$/)]],
        emailDomain: ['gmail.com', [Validators.required]],
        address1: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9#,.-\/]+( [a-zA-Z0-9#,.-\/]+)*$/)]],
        address2: ['', [Validators.maxLength(100), Validators.pattern(/^$|^[a-zA-Z0-9#,.-\/]+( [a-zA-Z0-9#,.-\/]+)*$/)]],
        city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]],
        state: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+( [a-zA-Z]+)*$/)]],
        zipCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
        dob: ['', [Validators.required, this.minAgeValidator(18)]]
      },
      { validators: [this.passwordMatchValidator] }
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  goBack(): void {
    this.location.back();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isFieldValid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  minAgeValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const dob = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= minAge ? null : { underAge: true };
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
