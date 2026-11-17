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
    
    @if (loading) {
      <div class="admin-card" style="color:var(--text-muted);font-size:12px;letter-spacing:1px;">LOADING...</div>
    }
    @if (!loading && chronicles.length === 0) {
      <div class="admin-card">No chronicles yet.</div>
    }
    
    @if (!loading && chronicles.length > 0) {
      <div class="admin-card">
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
            @for (c of chronicles; track c) {
              <tr>
                <td><strong>{{ c.title }}</strong></td>
                <td>
                  <span class="status-badge" [class.status-badge--live]="c.publishedAt">
                    {{ c.publishedAt ? 'PUBLISHED' : 'DRAFT' }}
                  </span>
                </td>
                <td style="color:var(--text-muted);">{{ c.passageCount }}</td>
                <td style="color:var(--text-muted);font-size:11px;">{{ c.createdAt | date:'dd MMM yyyy' }}</td>
                <td>
                  @if (confirmDeleteId !== c.id) {
                    <div class="row-actions">
                      <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/chronicles', c.id, 'passages']">Passages</button>
                      <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/chronicles', c.id]">Edit</button>
                      <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="confirmDeleteId = c.id">Del</button>
                    </div>
                  }
                  @if (confirmDeleteId === c.id) {
                    <div class="admin-confirm-row">
                      Sure?
                      <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="delete(c.id)">Yes</button>
                      <button class="admin-btn admin-btn-sm" (click)="confirmDeleteId = null">No</button>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    
    @if (toast) {
      <div class="admin-toast toast-success">{{ toast }}</div>
    }
    `,
  styles: [`
    .status-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; letter-spacing: 1px; font-weight: 700;
      background: var(--surface-2); color: var(--text-muted);
      border: 1px solid var(--border-strong);
    }
    .status-badge--live {
      color: var(--accent); border-color: var(--accent); background: var(--accent-soft);
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
