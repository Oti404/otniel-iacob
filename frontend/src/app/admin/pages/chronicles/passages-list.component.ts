import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { Chronicle, Passage } from '@monorepo/shared';

@Component({
  selector: 'app-passages-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>
        <span style="opacity:0.5;">{{ chronicle?.title ?? '...' }} /</span> Passages
      </h2>
      <div style="display:flex;gap:8px;">
        <button class="admin-btn" routerLink="/admin/chronicles">← Chronicles</button>
        <button class="admin-btn admin-btn-primary"
          [routerLink]="['/admin/chronicles', chronicleId, 'passages', 'new']">+ New Passage</button>
      </div>
    </div>

    <div class="admin-card" *ngIf="loading" style="color:var(--admin-text-muted);font-size:12px;letter-spacing:1px;">LOADING...</div>
    <div class="admin-card" *ngIf="!loading && passages.length === 0">No passages yet. Add one!</div>

    <div class="admin-card" *ngIf="!loading && passages.length > 0">
      <table class="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Status</th>
            <th>Media</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of passages">
            <td style="color:var(--admin-text-muted);font-size:11px;width:40px;">{{ p.order }}</td>
            <td><strong>{{ p.title }}</strong></td>
            <td>
              <span class="status-badge" [class.status-badge--live]="p.publishedAt">
                {{ p.publishedAt ? 'PUBLISHED' : 'DRAFT' }}
              </span>
            </td>
            <td style="color:var(--admin-text-muted);font-size:11px;">{{ p.media.length }} file{{ p.media.length !== 1 ? 's' : '' }}</td>
            <td>
              <div class="row-actions" *ngIf="confirmDeleteId !== p.id">
                <button class="admin-btn admin-btn-sm"
                  [routerLink]="['/admin/chronicles', chronicleId, 'passages', p.id]">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="confirmDeleteId = p.id">Del</button>
              </div>
              <div class="admin-confirm-row" *ngIf="confirmDeleteId === p.id">
                Sure?
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="delete(p.id)">Yes</button>
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
export class PassagesListComponent implements OnInit {
  private adminData = inject(AdminDataService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  chronicleId!: number;
  chronicle: Chronicle | null = null;
  passages: Passage[] = [];
  loading = true;
  confirmDeleteId: number | null = null;
  toast = '';

  ngOnInit() {
    this.chronicleId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.adminData.getAdminChronicle(this.chronicleId).subscribe({
      next: (data) => {
        this.chronicle = data;
        this.passages = (data.passages ?? []).sort((a, b) => a.order - b.order);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  delete(pid: number) {
    this.adminData.deletePassage(pid).subscribe({
      next: () => { this.confirmDeleteId = null; this.load(); this.showToast('Passage deleted'); },
    });
  }

  showToast(msg: string) {
    this.toast = msg; this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
