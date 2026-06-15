import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { Chronicle } from '@monorepo/shared';

type ChronicleRow = Chronicle & { passageCount: number };

@Component({
  selector: 'app-chronicles-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>Chronicles</h2>
      <button class="admin-btn admin-btn-primary" routerLink="/admin/chronicles/new">+ New Chronicle</button>
    </div>

    <div class="admin-card" *ngIf="loading" style="color:var(--admin-text-muted);font-size:12px;letter-spacing:1px;">LOADING...</div>
    <div class="admin-card" *ngIf="!loading && chronicles.length === 0">No chronicles yet.</div>

    <div class="admin-card" *ngIf="!loading && chronicles.length > 0">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Passages</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of chronicles">
            <td><strong>{{ c.title }}</strong></td>
            <td>
              <span class="status-badge" [class.status-badge--live]="c.publishedAt">
                {{ c.publishedAt ? 'PUBLISHED' : 'DRAFT' }}
              </span>
            </td>
            <td style="color:var(--admin-text-muted);">{{ c.passageCount }}</td>
            <td style="color:var(--admin-text-muted);font-size:11px;">{{ c.createdAt | date:'dd MMM yyyy' }}</td>
            <td>
              <div class="row-actions" *ngIf="confirmDeleteId !== c.id">
                <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/chronicles', c.id, 'passages']">Passages</button>
                <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/chronicles', c.id]">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="confirmDeleteId = c.id">Del</button>
              </div>
              <div class="admin-confirm-row" *ngIf="confirmDeleteId === c.id">
                Sure?
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="delete(c.id)">Yes</button>
                <button class="admin-btn admin-btn-sm" (click)="confirmDeleteId = null">No</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="admin-toast toast-success" *ngIf="toast">{{ toast }}</div>
  `,
  styles: [`
    .status-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; letter-spacing: 1px; font-weight: 700;
      background: var(--admin-surface-2); color: var(--admin-text-muted);
      border: 1px solid var(--admin-border);
    }
    .status-badge--live {
      color: var(--admin-neon); border-color: var(--admin-neon); background: var(--admin-neon-dim);
    }
    .row-actions { display: flex; gap: 6px; }
  `],
})
export class ChroniclesListComponent implements OnInit {
  private adminData = inject(AdminDataService);
  private cdr = inject(ChangeDetectorRef);

  chronicles: ChronicleRow[] = [];
  loading = true;
  confirmDeleteId: number | null = null;
  toast = '';

  ngOnInit() { this.load(); }

  load() {
    this.adminData.getAdminChronicles().subscribe({
      next: (data) => { this.chronicles = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  delete(id: number) {
    this.adminData.deleteChronicle(id).subscribe({
      next: () => { this.confirmDeleteId = null; this.load(); this.showToast('Chronicle deleted'); },
    });
  }

  showToast(msg: string) {
    this.toast = msg; this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
