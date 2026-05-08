import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { Experience } from '@monorepo/shared';

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>Experience List</h2>
      <button class="admin-btn admin-btn-primary" routerLink="/admin/experience/new">+ Add Experience</button>
    </div>

    <div class="admin-card" *ngIf="experiences.length > 0; else empty">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Company</th>
            <th>Role</th>
            <th>Type</th>
            <th>Period</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let ex of experiences; let i = index">
            <td>
              <div class="admin-order-btns">
                <button (click)="move(i, -1)" [disabled]="i === 0">▲</button>
                <button (click)="move(i, 1)" [disabled]="i === experiences.length - 1">▼</button>
              </div>
            </td>
            <td><strong>{{ ex.company }}</strong></td>
            <td>{{ ex.role }}</td>
            <td><span class="admin-badge badge-{{ ex.type }}">{{ ex.type }}</span></td>
            <td>{{ ex.startDate | date:'MMM yyyy' }} - {{ ex.endDate ? (ex.endDate | date:'MMM yyyy') : 'Present' }}</td>
            <td>
              <div class="actions" *ngIf="confirmDeleteId !== ex.id">
                <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/experience', ex.id]">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" style="margin-left:8px;" (click)="confirmDeleteId = ex.id">Del</button>
              </div>
              <div class="admin-confirm-row" *ngIf="confirmDeleteId === ex.id">
                Sure? 
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="deleteExperience(ex.id)">Yes</button>
                <button class="admin-btn admin-btn-sm" (click)="confirmDeleteId = null">No</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <ng-template #empty>
      <div class="admin-card">No experience found. Add one!</div>
    </ng-template>

    <div class="admin-toast toast-success" *ngIf="toastMsg">{{ toastMsg }}</div>
  `,
})
export class ExperienceListComponent implements OnInit {
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  cdr = inject(ChangeDetectorRef);

  experiences: Experience[] = [];
  confirmDeleteId: number | null = null;
  toastMsg = '';

  ngOnInit() { this.load(); }

  load() {
    this.contentService.getExperience().subscribe(data => {
      this.experiences = data.sort((a, b) => a.order - b.order);
      this.cdr.detectChanges();
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 3000);
  }

  move(i: number, direction: -1 | 1) {
    const current = this.experiences[i];
    const adjacent = this.experiences[i + direction];
    forkJoin([
      this.adminDataService.updateExperience(current.id, { order: adjacent.order }),
      this.adminDataService.updateExperience(adjacent.id, { order: current.order }),
    ]).subscribe(() => { this.load(); this.showToast('Order updated'); });
  }

  deleteExperience(id: number) {
    this.adminDataService.deleteExperience(id).subscribe(() => {
      this.confirmDeleteId = null;
      this.load();
      this.showToast('Experience deleted');
    });
  }
}
