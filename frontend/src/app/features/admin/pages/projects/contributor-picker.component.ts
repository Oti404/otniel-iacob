import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { Contributor } from '@monorepo/shared';

@Component({
  selector: 'app-contributor-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cp-overlay" (click)="close()"></div>
    <div class="cp-modal">
    
      <div class="cp-header">
        <span>Contributors</span>
        <button class="cp-close" (click)="close()">✕</button>
      </div>
    
      <!-- Add new -->
      <div class="cp-add-form">
        <input class="admin-input" [(ngModel)]="newName" placeholder="Name *" style="flex:1;">
        <input class="admin-input" [(ngModel)]="newLink" placeholder="Link (optional)">
        <button class="admin-btn admin-btn-primary admin-btn-sm" (click)="addNew()" [disabled]="!newName.trim()">+ Add</button>
        @if (addError) {
          <span class="cp-error">{{ addError }}</span>
        }
      </div>
    
      <!-- Search -->
      <input class="admin-input cp-search" [(ngModel)]="search" placeholder="Search...">
    
      <!-- List -->
      <div class="cp-list">
        @for (c of filtered(); track c) {
          <div class="cp-item"
            [class.selected]="isSelected(c.id)">
            @if (editingId !== c.id) {
              <span class="cp-name" (click)="toggle(c)">
                <span class="cp-check">{{ isSelected(c.id) ? '✓' : '' }}</span>
                {{ c.name }}
                @if (c.link) {
                  <a [href]="c.link" target="_blank" class="cp-link" (click)="$event.stopPropagation()">↗</a>
                }
              </span>
              <div class="cp-actions">
                <button class="admin-btn admin-btn-sm" (click)="startEdit(c)">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="remove(c.id)">Del</button>
              </div>
            } @else {
              <input class="admin-input" [(ngModel)]="editName" style="flex:1;">
              <input class="admin-input" [(ngModel)]="editLink" placeholder="Link">
              <button class="admin-btn admin-btn-sm admin-btn-primary" (click)="saveEdit(c.id)">Save</button>
              <button class="admin-btn admin-btn-sm" (click)="editingId = null">✕</button>
            }
          </div>
        }
        @if (filtered().length === 0) {
          <div class="cp-empty">No contributors found.</div>
        }
      </div>
    
      <div class="cp-footer">
        <span style="color:var(--text-muted); font-size:11px;">{{ selectedIds.length }} selected</span>
        <button class="admin-btn admin-btn-primary" (click)="confirm()">Done</button>
      </div>
    
    </div>
    `,
  styles: [`
    .cp-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 1000;
    }
    .cp-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1001;
      background: var(--surface);
      border: 1px solid var(--accent);
      border-radius: var(--radius-sm);
      width: 480px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 30px rgba(0,255,204,0.1);
    }
    .cp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-strong);
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--accent);
    }
    .cp-close {
      background: none; border: none;
      color: var(--text-muted);
      cursor: pointer; font-size: 14px;
      &:hover { color: var(--danger); }
    }
    .cp-add-form {
      display: flex; flex-direction: column;
      gap: 6px; padding: 12px 16px;
      border-bottom: 1px solid var(--border-strong);
    }
    .cp-error { color: var(--danger); font-size: 11px; }
    .cp-search { margin: 10px 16px 0; width: calc(100% - 32px); box-sizing: border-box; }
    .cp-list {
      overflow-y: auto;
      flex: 1;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .cp-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      transition: border-color 0.15s;
      &.selected { border-color: var(--accent); background: var(--accent-soft); }
    }
    .cp-name {
      flex: 1; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      font-size: 13px;
      &:hover { color: var(--accent); }
    }
    .cp-check {
      width: 14px; color: var(--accent);
      font-size: 11px; flex-shrink: 0;
    }
    .cp-link { color: var(--accent); font-size: 11px; text-decoration: none; }
    .cp-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .cp-empty { color: var(--text-muted); font-size: 12px; padding: 16px 0; text-align: center; }
    .cp-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      border-top: 1px solid var(--border-strong);
    }
  `]
})
export class ContributorPickerComponent implements OnInit {
  @Input() selectedIds: number[] = [];
  @Output() done = new EventEmitter<number[]>();
  @Output() closed = new EventEmitter<void>();

  adminDataService = inject(AdminDataService);
  cdr = inject(ChangeDetectorRef);

  all: Contributor[] = [];
  search = '';
  newName = '';
  newLink = '';
  addError = '';
  editingId: number | null = null;
  editName = '';
  editLink = '';

  ngOnInit() { this.load(); }

  load() {
    this.adminDataService.getContributors().subscribe(data => {
      this.all = data;
      this.cdr.detectChanges();
    });
  }

  filtered() {
    const q = this.search.toLowerCase();
    return this.all.filter(c => c.name.toLowerCase().includes(q));
  }

  isSelected(id: number) { return this.selectedIds.includes(id); }

  toggle(c: Contributor) {
    if (this.isSelected(c.id)) {
      this.selectedIds = this.selectedIds.filter(id => id !== c.id);
    } else {
      this.selectedIds = [...this.selectedIds, c.id];
    }
    this.cdr.detectChanges();
  }

  addNew() {
    this.addError = '';
    const data = { name: this.newName.trim(), link: this.newLink.trim() || null };
    this.adminDataService.createContributor(data).subscribe({
      next: (c) => {
        this.all = [...this.all, c].sort((a, b) => a.name.localeCompare(b.name));
        this.newName = '';
        this.newLink = '';
        this.cdr.detectChanges();
      },
      error: () => { this.addError = 'Failed to add.'; this.cdr.detectChanges(); }
    });
  }

  startEdit(c: Contributor) {
    this.editingId = c.id;
    this.editName = c.name;
    this.editLink = c.link ?? '';
    this.cdr.detectChanges();
  }

  saveEdit(id: number) {
    this.adminDataService.updateContributor(id, { name: this.editName, link: this.editLink || null }).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  remove(id: number) {
    this.adminDataService.deleteContributor(id).subscribe(() => {
      this.all = this.all.filter(c => c.id !== id);
      this.selectedIds = this.selectedIds.filter(sid => sid !== id);
      this.cdr.detectChanges();
    });
  }

  confirm() { this.done.emit([...this.selectedIds]); }
  close() { this.closed.emit(); }
}
