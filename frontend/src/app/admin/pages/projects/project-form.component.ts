import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Contributor } from '@monorepo/shared';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { ContributorPickerComponent } from './contributor-picker.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ContributorPickerComponent],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Project' : 'New Project' }}</h2>
      <button class="admin-btn" routerLink="/admin/projects">← Back</button>
    </div>

    <div class="admin-card" *ngIf="!loaded" style="color:var(--admin-text-muted); font-size:12px; letter-spacing:1px;">
      LOADING...
    </div>

    <form [formGroup]="form" (ngSubmit)="save()" class="pf-form" *ngIf="loaded">

      <div class="pf-section">
        <div class="pf-section-title">Basic Info</div>
        <div class="admin-form-group">
          <label class="admin-label">Name *</label>
          <input type="text" formControlName="name" class="admin-input" placeholder="Project name">
        </div>
        <div class="admin-form-group">
          <label class="admin-label">Description *</label>
          <textarea formControlName="description" class="admin-textarea" rows="4" placeholder="What does this project do?"></textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-label">Tech Stack *</label>
          <input type="text" formControlName="tech" class="admin-input" placeholder="e.g. Angular, Node.js, PostgreSQL">
        </div>
      </div>

      <div class="pf-section">
        <div class="pf-section-title">Links</div>
        <div class="pf-row">
          <div class="admin-form-group">
            <label class="admin-label">GitHub</label>
            <input type="url" formControlName="link" class="admin-input" placeholder="https://github.com/...">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Live Demo</label>
            <input type="url" formControlName="liveLink" class="admin-input" placeholder="https://...">
          </div>
        </div>
      </div>

      <div class="pf-section">
        <div class="pf-section-title">Timeline & Status</div>
        <div class="pf-row">
          <div class="admin-form-group">
            <label class="admin-label">Start Date *</label>
            <input type="date" formControlName="date" class="admin-input">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">End Date</label>
            <input type="date" formControlName="endDate" class="admin-input">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Status *</label>
            <select formControlName="status" class="admin-select">
              <option value="completed">Completed</option>
              <option value="wip">WIP</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div class="admin-form-group" *ngIf="isEdit">
            <label class="admin-label">Order</label>
            <input type="number" formControlName="order" class="admin-input">
          </div>
        </div>
      </div>

      <div class="pf-section">
        <div class="pf-section-title">Visibility & Contributors</div>
        <div class="pf-visibility-row">
          <input type="checkbox" formControlName="display" class="admin-checkbox" id="display">
          <label class="admin-label" for="display">Visible to Public</label>
        </div>
        <div class="admin-form-group" style="margin-top:12px;">
          <label class="admin-label">Contributors</label>
          <div class="pf-contributor-chips">
            <span class="pf-chip" *ngFor="let c of selectedContributors">
              {{ c.name }}
              <a *ngIf="c.link" [href]="c.link" target="_blank" style="color:var(--admin-neon); margin-left:4px; font-size:10px;">↗</a>
              <button type="button" (click)="removeContributor(c.id)">✕</button>
            </span>
            <span *ngIf="selectedContributors.length === 0" style="color:var(--admin-text-muted); font-size:12px;">None selected</span>
          </div>
          <button type="button" class="admin-btn admin-btn-sm" style="margin-top:8px;" (click)="showPicker = true">
            Manage Contributors
          </button>
        </div>
      </div>

      <app-contributor-picker
        *ngIf="showPicker"
        [selectedIds]="selectedContributorIds"
        (done)="onPickerDone($event)"
        (closed)="showPicker = false">
      </app-contributor-picker>

      <div class="pf-actions">
        <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid || saving">
          {{ saving ? 'SAVING...' : (isEdit ? 'SAVE CHANGES' : 'CREATE PROJECT') }}
        </button>
        <span class="pf-error" *ngIf="errorMessage">{{ errorMessage }}</span>
      </div>

    </form>
  `,
  styles: [`
    .pf-form { display: flex; flex-direction: column; gap: 0; }
    .pf-section {
      background: var(--admin-surface);
      border: 1px solid var(--admin-border);
      border-radius: var(--admin-radius);
      padding: 20px;
      margin-bottom: 12px;
    }
    .pf-section-title {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--admin-neon);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--admin-border);
      opacity: 0.8;
    }
    .pf-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .pf-visibility-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pf-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px 0 8px;
    }
    .pf-error { color: var(--admin-danger); font-size: 12px; letter-spacing: 0.5px; }
    .pf-contributor-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .pf-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 4px; font-size: 12px;
      border: 1px solid var(--admin-neon); color: var(--admin-neon);
      background: var(--admin-neon-dim);
      button { background: none; border: none; color: var(--admin-text-muted); cursor: pointer; font-size: 11px; padding: 0 2px; &:hover { color: var(--admin-danger); } }
    }
  `]
})
export class ProjectFormComponent implements OnInit {
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  cdr = inject(ChangeDetectorRef);

  isEdit = false;
  id: number | null = null;
  loaded = false;
  saving = false;
  errorMessage = '';
  showPicker = false;
  selectedContributorIds: number[] = [];
  selectedContributors: Contributor[] = [];
  allContributors: Contributor[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    tech: ['', Validators.required],
    link: [''],
    liveLink: [''],
    date: ['', Validators.required],
    endDate: [''],
    status: ['completed', Validators.required],
    order: [0, Validators.required],
    display: [true],
  });

  ngOnInit() {
    this.adminDataService.getContributors().subscribe(data => { this.allContributors = data; });
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.contentService.getProjects().subscribe(projects => {
        const p = projects.find(x => x.id === this.id);
        if (p) {
          this.form.patchValue({
            name: p.name, description: p.description, tech: p.tech,
            link: p.link || '', liveLink: p.liveLink || '',
            date: p.date ? p.date.substring(0, 10) : '',
            endDate: p.endDate ? p.endDate.substring(0, 10) : '',
            status: p.status, order: p.order, display: p.display,
          });
          if (p.contributors) {
            this.selectedContributors = p.contributors;
            this.selectedContributorIds = p.contributors.map(c => c.id);
          }
        }
        this.loaded = true;
        this.cdr.detectChanges();
      });
    } else {
      this.loaded = true;
    }
  }

  onPickerDone(ids: number[]) {
    this.selectedContributorIds = ids;
    this.selectedContributors = this.allContributors.filter(c => ids.includes(c.id));
    this.showPicker = false;
    this.cdr.detectChanges();
  }

  removeContributor(id: number) {
    this.selectedContributorIds = this.selectedContributorIds.filter(i => i !== id);
    this.selectedContributors = this.selectedContributors.filter(c => c.id !== id);
    this.cdr.detectChanges();
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const base = {
      name: val.name, description: val.description, tech: val.tech,
      link: val.link || null, liveLink: val.liveLink || null,
      date: new Date(val.date!).toISOString(),
      endDate: val.endDate ? new Date(val.endDate).toISOString() : null,
      status: val.status, display: val.display,
      contributorIds: this.selectedContributorIds,
    };
    const payload = this.isEdit ? { ...base, order: Number(val.order ?? 0) } : base;

    this.saving = true;
    this.errorMessage = '';
    const onError = (err: any) => {
      this.saving = false;
      this.errorMessage = err?.error?.message || 'Save failed.';
    };

    if (this.isEdit && this.id) {
      this.adminDataService.updateProject(this.id, payload as any).subscribe({
        next: () => this.router.navigate(['/admin/projects']),
        error: onError,
      });
    } else {
      this.adminDataService.createProject(payload as any).subscribe({
        next: () => this.router.navigate(['/admin/projects']),
        error: onError,
      });
    }
  }
}
