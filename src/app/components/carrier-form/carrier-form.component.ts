import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';

@Component({
  selector: 'app-carrier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="max-width: 1100px; margin: 0 auto; padding: 12px 0;">
      <!-- Main Card Container -->
      <div class="card" style="padding: 44px; border-radius: 24px; box-shadow: var(--shadow-card);">
        
        <!-- Header Bar -->
        <div style="margin-bottom: 32px; border-bottom: 1.5px solid var(--gray-200); padding-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <div class="card-title" style="font-size: 1.7rem; margin-bottom: 8px;">
              <span>⚙️ Airline Carrier Management & Rule Configuration</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              View registered carriers, manage tier discounts, advance booking perks, bulk discounts, and refund percentages.
            </p>
          </div>
          <div>
            <div class="badge" style="background: var(--info-sky); color: var(--info-text); padding: 12px 20px; font-size: 0.95rem; border-radius: 30px; border: 1.5px solid rgba(2, 132, 199, 0.25);">
              Total Carriers: <strong>{{ carriers.length }}</strong>
            </div>
          </div>
        </div>

        <!-- Section 1: REGISTERED CARRIERS INVENTORY TABLE -->
        <div style="margin-bottom: 44px;">
          <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.2rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            📋 Registered Carrier Inventory & Action Operations
          </div>

          <div *ngIf="loadingCarriers" style="text-align: center; padding: 36px; color: var(--gray-600); font-weight: 700;">
            Loading registered airline carriers...
          </div>

          <div *ngIf="!loadingCarriers && carriers.length === 0" class="alert alert-warning" style="margin-bottom: 28px;">
            No registered airline carriers found. Use the form below to add your first carrier.
          </div>

          <div *ngIf="!loadingCarriers && carriers.length > 0" class="table-responsive" style="margin-bottom: 28px;">
            <table class="table">
              <thead>
                <tr>
                  <th>Carrier ID</th>
                  <th>Carrier Name</th>
                  <th>Advance Discounts</th>
                  <th>Bulk Discount</th>
                  <th>Tier Discounts</th>
                  <th>Refund Rules</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of carriers">
                  <td><strong>#CAR-{{ c.carrierId }}</strong></td>
                  <td>
                    <strong style="color: var(--primary-navy); font-size: 1.05rem;">{{ c.carrierName }}</strong>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; color: var(--gray-800);">
                      30d: <strong>{{ c.discount30DaysAdvanceBooking }}%</strong> |
                      60d: <strong>{{ c.discount60DaysAdvanceBooking }}%</strong> |
                      90d: <strong>{{ c.discount90DaysAdvanceBooking }}%</strong>
                    </div>
                  </td>
                  <td>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800;">
                      {{ c.bulkBookingDiscount }}% Off
                    </span>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem;">
                      Silver: <strong>{{ c.silverUserDiscount }}%</strong> |
                      Gold: <strong>{{ c.goldUserDiscount }}%</strong> |
                      Plat: <strong>{{ c.platinumUserDiscount }}%</strong>
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; color: var(--gray-700);">
                      &lt;2d: <strong>{{ c.refund2DaysBeforeTravelDate }}%</strong> |
                      2-10d: <strong>{{ c.refund10DaysBeforeTravelDate }}%</strong> |
                      &ge;20d: <strong>{{ c.refund20DaysOrMoreBeforeTravelDate }}%</strong>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      <button (click)="openViewModal(c)" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 0.8rem;">
                        👁️ View
                      </button>
                      <button (click)="startEditCarrier(c)" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 0.8rem;">
                        ✏️ Edit
                      </button>
                      <button (click)="openDeleteModal(c)" class="btn btn-danger btn-sm" style="padding: 6px 10px; font-size: 0.8rem;">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 2px dashed var(--gray-300); margin: 40px 0;" />

        <!-- Section 2: CARRIER FORM (REGISTER & EDIT) -->
        <div #formSection>
          <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.2rem; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
            <span>{{ isEditMode ? '✏️ Update Carrier Details (#CAR-' + editingCarrierId + ')' : '➕ Register New Carrier Company' }}</span>
            <button *ngIf="isEditMode" (click)="cancelEditMode()" class="btn btn-secondary btn-sm">
              ✕ Cancel Edit Mode
            </button>
          </div>

          <!-- Mandatory Rules Banner - Formatted Line-by-Line -->
          <div class="alert alert-info" style="margin-bottom: 28px; flex-direction: column; align-items: flex-start; gap: 8px;">
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

          <div *ngIf="successMsg" class="alert alert-success" style="margin-bottom: 28px;">
            ✅ {{ successMsg }}
          </div>

          <div *ngIf="actionError" class="alert alert-danger" style="margin-bottom: 28px; font-weight: 800;">
            ❌ {{ actionError }}
          </div>

          <!-- Form Validation Errors Banner -->
          <div *ngIf="serverError || carrierForm.errors" class="alert alert-danger" style="margin-bottom: 28px; flex-direction: column; align-items: flex-start; gap: 8px;">
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
            <!-- Section A: Carrier Name & Bulk Discount -->
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
                  <label class="form-label">Bulk Booking Discount % (&ge;10 Seats, Max 25%) <span class="required">*</span></label>
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

            <!-- Section B: Advance Booking Discounts -->
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

            <!-- Section C: Customer Membership Tier Discounts -->
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

            <!-- Section D: Cancellation Refund Rules -->
            <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 28px; border-radius: 18px; margin-bottom: 32px;">
              <div style="font-weight: 800; color: var(--primary-navy); font-size: 1.05rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                🚫 Cancellation Refund Rules (% Refunded to Customer, Max 40%)
              </div>

              <div class="grid-3" style="gap: 24px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">&lt; 2 Days Prior Refund % (Max 40%) <span class="required">*</span></label>
                  <input
                    type="number"
                    formControlName="refund2DaysPrior"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isFieldInvalid('refund2DaysPrior') }"
                    placeholder="e.g. 20.0"
                    step="0.1"
                  />
                  <div *ngIf="isFieldInvalid('refund2DaysPrior')" class="invalid-feedback">
                    Percentage must be between 0% and 40%.
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">2 to 10 Days Prior Refund % (Max 40%) <span class="required">*</span></label>
                  <input
                    type="number"
                    formControlName="refund10DaysPrior"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isFieldInvalid('refund10DaysPrior') }"
                    placeholder="e.g. 30.0"
                    step="0.1"
                  />
                  <div *ngIf="isFieldInvalid('refund10DaysPrior')" class="invalid-feedback">
                    Percentage must be between 0% and 40%.
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">&ge; 20 Days Prior Refund % (Max 40%) <span class="required">*</span></label>
                  <input
                    type="number"
                    formControlName="refund20DaysPrior"
                    class="form-control"
                    [ngClass]="{ 'is-invalid': isFieldInvalid('refund20DaysPrior') }"
                    placeholder="e.g. 40.0"
                    step="0.1"
                  />
                  <div *ngIf="isFieldInvalid('refund20DaysPrior')" class="invalid-feedback">
                    Percentage must be between 0% and 40%.
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Actions -->
            <div style="margin-top: 36px; display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid var(--gray-200); padding-top: 24px;">
              <button type="button" (click)="goBack()" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
                &larr; Back to Previous Page
              </button>
              <button type="submit" class="btn btn-primary" style="padding: 14px 28px; font-size: 1.02rem; font-weight: 800;" [disabled]="isSubmitting">
                <span *ngIf="isSubmitting">Saving Carrier Rules...</span>
                <span *ngIf="!isSubmitting">{{ isEditMode ? 'Update Carrier Rules &rarr;' : 'Save & Register Carrier &rarr;' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- VIEW CARRIER DETAILS MODAL -->
    <div class="modal-backdrop" *ngIf="showViewModal && activeCarrier">
      <div class="modal-content" style="max-width: 680px; padding: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1.5px solid var(--gray-200); padding-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 900; color: var(--primary-navy); margin: 0;">
              🏢 {{ activeCarrier.carrierName }} Details
            </h3>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Carrier ID Reference: #CAR-{{ activeCarrier.carrierId }}</span>
          </div>
          <button (click)="closeViewModal()" class="btn btn-outline" style="padding: 4px 10px; font-size: 1.1rem;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px;">
          <!-- Advance Perks -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 8px;">📅 Advance Booking Discount Perks</div>
            <div style="font-size: 0.9rem; color: var(--gray-700); display: flex; justify-content: space-between;">
              <span>30 Days Advance: <strong>{{ activeCarrier.discount30DaysAdvanceBooking }}%</strong></span>
              <span>60 Days Advance: <strong>{{ activeCarrier.discount60DaysAdvanceBooking }}%</strong></span>
              <span>90 Days Advance: <strong>{{ activeCarrier.discount90DaysAdvanceBooking }}%</strong></span>
            </div>
          </div>

          <!-- Bulk & Tier -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 8px;">⭐ Bulk & Membership Tier Discounts</div>
            <div style="font-size: 0.9rem; color: var(--gray-700); display: flex; flex-direction: column; gap: 6px;">
              <div>Bulk Discount (&ge;10 seats): <strong>{{ activeCarrier.bulkBookingDiscount }}% Off</strong></div>
              <div>Silver Tier Member: <strong>{{ activeCarrier.silverUserDiscount }}% Off</strong></div>
              <div>Gold Tier Member: <strong>{{ activeCarrier.goldUserDiscount }}% Off</strong></div>
              <div>Platinum Tier Member: <strong>{{ activeCarrier.platinumUserDiscount }}% Off</strong></div>
            </div>
          </div>

          <!-- Refund Rules -->
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 8px;">🚫 Cancellation Refund Rules</div>
            <div style="font-size: 0.9rem; color: var(--gray-700); display: flex; flex-direction: column; gap: 6px;">
              <div>&lt; 2 Days Prior: <strong>{{ activeCarrier.refund2DaysBeforeTravelDate }}% Refunded</strong></div>
              <div>2 to 10 Days Prior: <strong>{{ activeCarrier.refund10DaysBeforeTravelDate }}% Refunded</strong></div>
              <div>&ge; 20 Days Prior: <strong>{{ activeCarrier.refund20DaysOrMoreBeforeTravelDate }}% Refunded</strong></div>
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <button (click)="closeViewModal()" class="btn btn-secondary">Close View</button>
        </div>
      </div>
    </div>

    <!-- DELETE CARRIER CONFIRMATION MODAL -->
    <div class="modal-backdrop" *ngIf="showDeleteModal && activeCarrier">
      <div class="modal-content" style="max-width: 580px; padding: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h3 style="font-size: 1.4rem; font-weight: 900; color: #dc2626;">
            🗑️ Confirm Carrier Deletion
          </h3>
          <button (click)="closeDeleteModal()" class="btn btn-outline" style="padding: 4px 10px; font-size: 1.1rem;">✕</button>
        </div>

        <div class="alert alert-danger" style="margin-bottom: 24px;">
          <strong>Warning:</strong> You are about to permanently remove carrier <strong>{{ activeCarrier.carrierName }}</strong> (#CAR-{{ activeCarrier.carrierId }}) from system inventory.
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 16px;">
          <button (click)="closeDeleteModal()" class="btn btn-secondary">Cancel</button>
          <button (click)="executeDeleteCarrier()" class="btn btn-danger" [disabled]="isDeleting" style="padding: 12px 24px; font-weight: 800;">
            <span *ngIf="isDeleting">Deleting Carrier...</span>
            <span *ngIf="!isDeleting">🗑️ Yes, Delete Carrier</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CarrierFormComponent implements OnInit {
  carrierForm: FormGroup;
  carriers: Carrier[] = [];
  loadingCarriers = true;

  isSubmitting = false;
  isEditMode = false;
  editingCarrierId: number | null = null;

  successMsg = '';
  serverError = '';
  actionError = '';

  showViewModal = false;
  showDeleteModal = false;
  activeCarrier: Carrier | null = null;
  isDeleting = false;

  constructor(
    private fb: FormBuilder,
    private carrierService: CarrierService,
    private location: Location
  ) {
    this.carrierForm = this.fb.group(
      {
        carrierName: ['', [Validators.required, Validators.minLength(2)]],
        discount30DaysAdvanceBooking: [5.0, [Validators.required, Validators.min(0), Validators.max(10)]],
        discount60DaysAdvanceBooking: [10.0, [Validators.required, Validators.min(0), Validators.max(15)]],
        discount90DaysAdvanceBooking: [15.0, [Validators.required, Validators.min(0), Validators.max(25)]],
        bulkBookingDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(25)]],
        refund2DaysPrior: [20.0, [Validators.required, Validators.min(0), Validators.max(40)]],
        refund10DaysPrior: [30.0, [Validators.required, Validators.min(0), Validators.max(40)]],
        refund20DaysPrior: [40.0, [Validators.required, Validators.min(0), Validators.max(40)]],
        silverUserDiscount: [5.0, [Validators.required, Validators.min(0), Validators.max(15)]],
        goldUserDiscount: [10.0, [Validators.required, Validators.min(0), Validators.max(20)]],
        platinumUserDiscount: [15.0, [Validators.required, Validators.min(0), Validators.max(30)]]
      },
      { validators: [this.hierarchyValidator] }
    );
  }

  ngOnInit(): void {
    this.loadCarriers();
  }

  loadCarriers(): void {
    this.loadingCarriers = true;
    this.carrierService.getAllCarriers().subscribe({
      next: (data: Carrier[]) => {
        this.carriers = data;
        this.loadingCarriers = false;
      },
      error: () => this.loadingCarriers = false
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

  openViewModal(c: Carrier): void {
    this.activeCarrier = c;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.activeCarrier = null;
  }

  startEditCarrier(c: Carrier): void {
    this.isEditMode = true;
    this.editingCarrierId = c.carrierId || null;
    this.successMsg = '';
    this.serverError = '';
    this.actionError = '';

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
  }

  cancelEditMode(): void {
    this.isEditMode = false;
    this.editingCarrierId = null;
    this.carrierForm.reset({
      discount30DaysAdvanceBooking: 5.0,
      discount60DaysAdvanceBooking: 10.0,
      discount90DaysAdvanceBooking: 15.0,
      bulkBookingDiscount: 10.0,
      refund2DaysPrior: 20.0,
      refund10DaysPrior: 30.0,
      refund20DaysPrior: 40.0,
      silverUserDiscount: 5.0,
      goldUserDiscount: 10.0,
      platinumUserDiscount: 15.0
    });
  }

  openDeleteModal(c: Carrier): void {
    this.activeCarrier = c;
    this.actionError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.activeCarrier = null;
  }

  executeDeleteCarrier(): void {
    if (!this.activeCarrier?.carrierId) return;

    this.isDeleting = true;
    this.actionError = '';
    const id = this.activeCarrier.carrierId;
    const name = this.activeCarrier.carrierName;

    this.carrierService.deleteCarrier(id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.successMsg = `Carrier '${name}' (#CAR-${id}) deleted permanently from inventory.`;
        this.closeDeleteModal();
        this.loadCarriers();
      },
      error: (err: any) => {
        this.isDeleting = false;
        const msg = err.error?.message || err.message || '';
        if (msg.includes("active flights") || msg.includes("active") || msg.includes("500") || msg.includes("Internal")) {
          this.actionError = "We can't delete the carrier, it has active flights.";
        } else {
          this.actionError = msg || "We can't delete the carrier, it has active flights.";
        }
        this.closeDeleteModal();
      }
    });
  }

  onSubmit(): void {
    this.successMsg = '';
    this.serverError = '';
    this.actionError = '';

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

    if (this.isEditMode && this.editingCarrierId) {
      this.carrierService.updateCarrier(this.editingCarrierId, carrierPayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.successMsg = `Carrier '${res.carrierName}' (#CAR-${res.carrierId}) updated successfully!`;
          this.cancelEditMode();
          this.loadCarriers();
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
          this.cancelEditMode();
          this.loadCarriers();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.serverError = err.error?.message || 'Failed to register carrier. Please check input parameters.';
        }
      });
    }
  }
}
