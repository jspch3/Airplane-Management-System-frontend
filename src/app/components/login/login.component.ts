import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 480px; margin: 40px auto;">
      <div class="card" style="box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.12);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #0284c7, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px auto; box-shadow: 0 8px 20px rgba(2, 132, 199, 0.3);">
            🔑
          </div>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--primary-navy); letter-spacing: -0.02em;">
            Welcome Back
          </h2>
          <p class="card-subtitle" style="margin-top: 4px; margin-bottom: 0;">
            Sign in to access your flight bookings or administrative portal.
          </p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Username Input (Renders completely blank) -->
          <div class="form-group">
            <label class="form-label">Username <span class="required">*</span></label>
            <input
              type="text"
              formControlName="userName"
              class="form-control"
              [ngClass]="{ 'is-invalid': isFieldInvalid('userName') }"
              placeholder="Enter your registered username"
            />
            <div *ngIf="isFieldInvalid('userName')" class="invalid-feedback">
              Username is required.
            </div>
          </div>

          <!-- Password Input with Show Password Toggle -->
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="margin-bottom: 0;">Password <span class="required">*</span></label>
              <button type="button" (click)="openForgotPasswordModal()" style="background: none; border: none; color: var(--primary-blue); font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0;">
                Forgot Password?
              </button>
            </div>
            <div style="position: relative;">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control"
                style="padding-right: 46px;"
                [ngClass]="{ 'is-invalid': isFieldInvalid('password') || loginError }"
                placeholder="Enter your password"
              />
              <button
                type="button"
                (click)="toggleShowPassword()"
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--gray-600); z-index: 10;"
                [title]="showPassword ? 'Hide Password' : 'Show Password'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div *ngIf="isFieldInvalid('password')" class="invalid-feedback">
              Password is required.
            </div>
            <div *ngIf="loginError" class="invalid-feedback">
              {{ loginError }}
            </div>
          </div>

          <div style="margin-top: 28px;">
            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px 24px; font-size: 1rem;" [disabled]="isSubmitting">
              <span *ngIf="isSubmitting">Authenticating...</span>
              <span *ngIf="!isSubmitting">Sign In to Dashboard &rarr;</span>
            </button>
          </div>
        </form>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--gray-200); text-align: center; font-size: 0.925rem; color: var(--text-muted);">
          Don't have an account? 
          <a routerLink="/register" style="color: var(--primary-blue); font-weight: 700; text-decoration: none;">
            Create a Customer Account
          </a>
        </div>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <button type="button" (click)="goBack()" class="btn btn-secondary" style="font-size: 0.875rem;">
          &larr; Back to Previous Page
        </button>
      </div>
    </div>

    <!-- FORGOT PASSWORD MODAL -->
    <div *ngIf="showForgotModal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 16px;">
      <div class="card" style="width: 100%; max-width: 440px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-navy); margin: 0;">
            🔒 Forgot Password Reset
          </h3>
          <button (click)="closeForgotPasswordModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <div *ngIf="forgotError" class="alert alert-danger" style="font-size: 0.875rem; margin-bottom: 16px;">
          ❌ {{ forgotError }}
        </div>

        <div *ngIf="forgotSuccess" class="alert alert-success" style="font-size: 0.875rem; margin-bottom: 16px;">
          ✅ {{ forgotSuccess }}
        </div>

        <!-- STEP 1: Enter Username or Email -->
        <div *ngIf="forgotStep === 1">
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">
            Enter your registered Username or Email ID to initiate security verification.
          </p>
          <div class="form-group">
            <label class="form-label">Username or Email <span class="required">*</span></label>
            <input
              type="text"
              [(ngModel)]="forgotIdentity"
              class="form-control"
              placeholder="e.g. sarah123 or sarah@gmail.com"
            />
          </div>
          <button (click)="onFindMaskedPhone()" class="btn btn-primary" style="width: 100%; margin-top: 12px;" [disabled]="forgotLoading">
            {{ forgotLoading ? 'Verifying Identity...' : 'Find Registered Phone' }}
          </button>
        </div>

        <!-- STEP 2: Mobile Number Match Verification -->
        <div *ngIf="forgotStep === 2">
          <div style="background: #e0f2fe; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #bae6fd;">
            <span style="font-size: 0.85rem; color: #0369a1; font-weight: 600;">
              Account: <strong>{{ foundUserName }}</strong><br/>
              Registered Phone: <strong>{{ maskedPhone }}</strong>
            </span>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 12px;">
            Enter your full 10-digit mobile number to verify account ownership.
          </p>
          <div class="form-group">
            <label class="form-label">Full Mobile Number <span class="required">*</span></label>
            <input
              type="tel"
              inputmode="numeric"
              [(ngModel)]="fullMobileInput"
              class="form-control"
              placeholder="10 digits (e.g. 9876543210)"
            />
          </div>
          <button (click)="onVerifyMobile()" class="btn btn-primary" style="width: 100%; margin-top: 12px;" [disabled]="forgotLoading">
            {{ forgotLoading ? 'Verifying Mobile...' : 'Verify Mobile Number' }}
          </button>
        </div>

        <!-- STEP 3: Reset Password Fields -->
        <div *ngIf="forgotStep === 3">
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 16px;">
            Mobile verified! Create a new password for account <strong>{{ foundUserName }}</strong>.
          </p>
          <div class="form-group">
            <label class="form-label">New Password <span class="required">*</span></label>
            <input
              type="password"
              [(ngModel)]="newPasswordInput"
              class="form-control"
              placeholder="At least 6 characters"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password <span class="required">*</span></label>
            <input
              type="password"
              [(ngModel)]="confirmNewPasswordInput"
              class="form-control"
              placeholder="Re-enter new password"
            />
          </div>
          <button (click)="onResetPasswordSubmit()" class="btn btn-primary" style="width: 100%; margin-top: 12px;" [disabled]="forgotLoading">
            {{ forgotLoading ? 'Updating Password...' : 'Reset Password' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  loginError = '';
  showPassword = false;

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Forgot password modal state
  showForgotModal = false;
  forgotStep = 1;
  forgotIdentity = '';
  foundUserName = '';
  maskedPhone = '';
  fullMobileInput = '';
  newPasswordInput = '';
  confirmNewPasswordInput = '';
  forgotLoading = false;
  forgotError = '';
  forgotSuccess = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  goBack(): void {
    this.location.back();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openForgotPasswordModal(): void {
    this.showForgotModal = true;
    this.forgotStep = 1;
    this.forgotIdentity = '';
    this.foundUserName = '';
    this.maskedPhone = '';
    this.fullMobileInput = '';
    this.newPasswordInput = '';
    this.confirmNewPasswordInput = '';
    this.forgotError = '';
    this.forgotSuccess = '';
  }

  closeForgotPasswordModal(): void {
    this.showForgotModal = false;
  }

  onFindMaskedPhone(): void {
    this.forgotError = '';
    if (!this.forgotIdentity.trim()) {
      this.forgotError = 'Please enter your registered Username or Email ID.';
      return;
    }
    this.forgotLoading = true;
    this.authService.getMaskedPhone(this.forgotIdentity.trim()).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.foundUserName = res.userName;
        this.maskedPhone = res.maskedPhone;
        this.forgotStep = 2;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'No registered account found with that identity.';
      }
    });
  }

  onVerifyMobile(): void {
    this.forgotError = '';
    if (!this.fullMobileInput.trim()) {
      this.forgotError = 'Please enter your 10-digit registered mobile number.';
      return;
    }
    this.forgotLoading = true;
    this.authService.verifyMobile(this.foundUserName, this.fullMobileInput.trim()).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotStep = 3;
      },
      error: (err) => {
        this.forgotLoading = false;
        // Exact requirement: "Mobile number not matched"
        this.forgotError = err.error?.message || 'Mobile number not matched';
      }
    });
  }

  onResetPasswordSubmit(): void {
    this.forgotError = '';
    if (!this.newPasswordInput || this.newPasswordInput.length < 6) {
      this.forgotError = 'New password must be at least 6 characters long.';
      return;
    }
    if (this.newPasswordInput !== this.confirmNewPasswordInput) {
      this.forgotError = 'Passwords do not match.';
      return;
    }

    this.forgotLoading = true;
    this.authService.resetPassword(this.foundUserName, this.fullMobileInput.trim(), this.newPasswordInput).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSuccess = 'Password reset successfully! You can now sign in with your new password.';
        setTimeout(() => {
          this.closeForgotPasswordModal();
        }, 2000);
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Password reset failed. Please try again.';
      }
    });
  }

  onSubmit(): void {
    this.loginError = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { userName, password } = this.loginForm.value;

    this.authService.login(userName, password).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.loginError = err.error?.message || 'Invalid Username or Password.';
      }
    });
  }
}
