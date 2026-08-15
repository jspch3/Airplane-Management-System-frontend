import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

          <!-- Password Input (Renders completely blank) -->
          <div class="form-group">
            <label class="form-label">Password <span class="required">*</span></label>
            <input
              type="password"
              formControlName="password"
              class="form-control"
              [ngClass]="{ 'is-invalid': isFieldInvalid('password') || loginError }"
              placeholder="Enter your password"
            />
            <div *ngIf="isFieldInvalid('password')" class="invalid-feedback">
              Password is required.
            </div>
            <!-- Credential error directly below password box -->
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
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {
    // Completely blank login inputs
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
