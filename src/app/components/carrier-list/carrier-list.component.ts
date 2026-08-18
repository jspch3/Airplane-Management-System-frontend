import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarrierService } from '../../services/carrier.service';
import { Carrier } from '../../models/carrier.model';

@Component({
  selector: 'app-carrier-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width: 1220px; margin: 0 auto; padding: 12px 0;">
      <div class="card" style="padding: 44px; border-radius: 24px; box-shadow: var(--shadow-card);">
        
        <!-- Header Bar with Generous Spacing -->
        <div style="margin-bottom: 32px; border-bottom: 1.5px solid var(--gray-200); padding-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <div>
            <div class="card-title" style="font-size: 1.7rem; margin-bottom: 8px;">
              <span>🏢 Registered Airline Carriers</span>
            </div>
            <p class="card-subtitle" style="margin-bottom: 0;">
              View registered carriers, manage tier discounts, advance booking perks, bulk discounts, and refund percentages.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div class="badge" style="background: var(--info-sky); color: var(--info-text); padding: 12px 20px; font-size: 0.95rem; border-radius: 30px; border: 1.5px solid rgba(2, 132, 199, 0.25);">
              Total Registered Carriers: <strong>{{ carriers.length }}</strong>
            </div>

            <!-- Add New Carrier Button -->
            <a routerLink="/admin/carriers/new" class="btn btn-primary" style="padding: 12px 24px; font-size: 0.95rem; font-weight: 800;">
              ➕ Add New Carrier
            </a>
          </div>
        </div>

        <div *ngIf="actionMsg" class="alert alert-success" style="margin-bottom: 32px;">
          ✅ {{ actionMsg }}
        </div>

        <div *ngIf="actionError" class="alert alert-danger" style="font-weight: 800; font-size: 1rem; padding: 20px; margin-bottom: 32px;">
          ❌ {{ actionError }}
        </div>

        <div *ngIf="isLoading" style="text-align: center; padding: 48px; color: var(--gray-600); font-weight: 700; font-size: 1.05rem;">
          Loading registered airline carriers...
        </div>

        <div *ngIf="!isLoading && carriers.length === 0" class="alert alert-warning" style="margin-bottom: 36px;">
          No registered airline carriers found in system inventory.
        </div>

        <!-- Carrier Inventory Table -->
        <div *ngIf="!isLoading && carriers.length > 0" class="table-responsive" style="margin-bottom: 40px;">
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
                  <div style="font-size: 0.875rem; color: var(--gray-800); display: flex; flex-direction: column; gap: 2px;">
                    <div>30d: <strong>{{ c.discount30DaysAdvanceBooking }}% Off</strong></div>
                    <div>60d: <strong>{{ c.discount60DaysAdvanceBooking }}% Off</strong></div>
                    <div>90d: <strong>{{ c.discount90DaysAdvanceBooking }}% Off</strong></div>
                  </div>
                </td>
                <td>
                  <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 0.85rem;">
                    {{ c.bulkBookingDiscount }}% Off
                  </span>
                </td>
                <td>
                  <div style="font-size: 0.875rem; display: flex; flex-direction: column; gap: 2px;">
                    <div>Silver: <strong>{{ c.silverUserDiscount }}%</strong></div>
                    <div>Gold: <strong>{{ c.goldUserDiscount }}%</strong></div>
                    <div>Platinum: <strong>{{ c.platinumUserDiscount }}%</strong></div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.875rem; color: var(--gray-700); display: flex; flex-direction: column; gap: 2px;">
                    <div>&lt;2d: <strong>{{ c.refund2DaysBeforeTravelDate }}%</strong></div>
                    <div>2-10d: <strong>{{ c.refund10DaysBeforeTravelDate }}%</strong></div>
                    <div>&ge;20d: <strong>{{ c.refund20DaysOrMoreBeforeTravelDate }}%</strong></div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <button (click)="openViewModal(c)" class="btn btn-secondary btn-sm" style="padding: 8px 14px;">
                      👁️ View Details
                    </button>
                    <a [routerLink]="['/admin/carriers/edit', c.carrierId]" class="btn btn-primary btn-sm" style="padding: 8px 14px; font-weight: 700;">
                      ✏️ Edit Rules
                    </a>
                    <button (click)="openDeleteModal(c)" class="btn btn-danger btn-sm" style="padding: 8px 14px;">
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 36px; border-top: 1.5px solid var(--gray-200); padding-top: 24px;">
          <button type="button" (click)="goBack()" class="btn btn-secondary" style="padding: 12px 24px; font-weight: 700;">
            &larr; Back to Dashboard
          </button>
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
            <span style="font-size: 0.85rem; color: var(--text-muted);">Carrier Reference ID: #CAR-{{ activeCarrier.carrierId }}</span>
          </div>
          <button (click)="closeViewModal()" class="btn btn-outline" style="padding: 4px 10px; font-size: 1.1rem;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px;">
          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">📅 Advance Booking Discount Perks</div>
            <div style="font-size: 0.95rem; color: var(--gray-700); display: flex; justify-content: space-between;">
              <span>30 Days Advance: <strong>{{ activeCarrier.discount30DaysAdvanceBooking }}% Off</strong></span>
              <span>60 Days Advance: <strong>{{ activeCarrier.discount60DaysAdvanceBooking }}% Off</strong></span>
              <span>90 Days Advance: <strong>{{ activeCarrier.discount90DaysAdvanceBooking }}% Off</strong></span>
            </div>
          </div>

          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">⭐ Bulk & Membership Tier Discounts</div>
            <div style="font-size: 0.95rem; color: var(--gray-700); display: flex; flex-direction: column; gap: 8px;">
              <div>Bulk Booking Discount (&ge;10 seats): <strong>{{ activeCarrier.bulkBookingDiscount }}% Off</strong></div>
              <div>Silver Tier Member: <strong>{{ activeCarrier.silverUserDiscount }}% Off</strong></div>
              <div>Gold Tier Member: <strong>{{ activeCarrier.goldUserDiscount }}% Off</strong></div>
              <div>Platinum Tier Member: <strong>{{ activeCarrier.platinumUserDiscount }}% Off</strong></div>
            </div>
          </div>

          <div style="background: var(--gray-50); border: 1.5px solid var(--gray-200); padding: 20px; border-radius: 14px;">
            <div style="font-weight: 800; color: var(--primary-navy); margin-bottom: 10px;">🚫 Cancellation Refund Rules</div>
            <div style="font-size: 0.95rem; color: var(--gray-700); display: flex; flex-direction: column; gap: 8px;">
              <div>&lt; 2 Days Prior: <strong>{{ activeCarrier.refund2DaysBeforeTravelDate }}% Refunded</strong></div>
              <div>2 to 10 Days Prior: <strong>{{ activeCarrier.refund10DaysBeforeTravelDate }}% Refunded</strong></div>
              <div>&ge; 20 Days Prior: <strong>{{ activeCarrier.refund20DaysOrMoreBeforeTravelDate }}% Refunded</strong></div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <a [routerLink]="['/admin/carriers/edit', activeCarrier.carrierId]" (click)="closeViewModal()" class="btn btn-primary">
            ✏️ Edit Carrier Rules
          </a>
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
export class CarrierListComponent implements OnInit {
  carriers: Carrier[] = [];
  isLoading = true;
  actionMsg = '';
  actionError = '';

  showViewModal = false;
  showDeleteModal = false;
  activeCarrier: Carrier | null = null;
  isDeleting = false;

  constructor(
    private carrierService: CarrierService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadCarriers();
  }

  loadCarriers(): void {
    this.isLoading = true;
    this.carrierService.getAllCarriers().subscribe({
      next: (data: Carrier[]) => {
        this.carriers = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  goBack(): void {
    this.location.back();
  }

  openViewModal(c: Carrier): void {
    this.activeCarrier = c;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.activeCarrier = null;
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
        this.actionMsg = `Carrier '${name}' (#CAR-${id}) deleted permanently from inventory.`;
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
}
