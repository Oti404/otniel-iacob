import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { UploadService } from '../../services/upload.service';
import { Chronicle } from '@monorepo/shared';

@Component({
  selector: 'app-chronicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Chronicle' : 'New Chronicle' }}</h2>
      <button class="admin-btn" routerLink="/admin/chronicles">← Back</button>
    </div>

    <div class="admin-card" *ngIf="!loaded" style="color:var(--admin-text-muted);font-size:12px;letter-spacing:1px;">LOADING...</div>

    <ng-container *ngIf="loaded">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="pf-section">
          <div class="pf-section-title">Chronicle Info</div>

          <div class="admin-form-group">
            <label class="admin-label">Title *</label>
            <input type="text" formControlName="title" class="admin-input" placeholder="e.g. Transylvania Hike 2025">
          </div>

          <div class="admin-form-group">
            <label class="admin-label">Description</label>
            <textarea formControlName="description" class="admin-textarea" rows="3"
              placeholder="Short summary of this chronicle..."></textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-label">Cover Image</label>
            <input type="url" formControlName="coverImage" class="admin-input" placeholder="https://... or upload below">
            <div class="cover-upload-row">
              <input #coverInput type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden
                (change)="onCoverSelected($event)">
              <button type="button" class="admin-btn admin-btn-sm" [disabled]="uploadingCover"
                (click)="coverInput.click()">
                {{ uploadingCover ? 'Uploading...' : '⬆ Upload from computer' }}
              </button>
              <span class="cover-upload-error" *ngIf="coverError">{{ coverError }}</span>
            </div>
            <div class="cover-preview" *ngIf="form.value.coverImage">
              <img [src]="form.value.coverImage" alt="cover preview" (error)="onImgError($event)">
            </div>
          </div>
        </div>

        <div class="pf-section" *ngIf="isEdit && chronicle">
          <div class="pf-section-title">Publish</div>
          <div class="publish-row">
            <span class="status-text" [class.status-text--live]="chronicle.publishedAt">
              {{ chronicle.publishedAt ? '● Published ' + (chronicle.publishedAt | date:'dd MMM yyyy') : '○ Draft' }}
            </span>
            <button type="button" class="admin-btn admin-btn-primary"
              *ngIf="!chronicle.publishedAt" [disabled]="publishing" (click)="publish()">
              {{ publishing ? 'Publishing...' : 'PUBLISH' }}
            </button>
          </div>
          <div class="date-edit-row" *ngIf="chronicle.publishedAt">
            <label class="admin-label" style="margin:0;">Published date</label>
            <input type="date" class="admin-input" style="max-width:160px;" [(ngModel)]="publishedAtDate" [ngModelOptions]="{standalone: true}">
            <button type="button" class="admin-btn admin-btn-sm" [disabled]="savingDate" (click)="saveDate()">
              {{ savingDate ? 'Saving...' : 'Save Date' }}
            </button>
          </div>
          <div style="margin-top:10px;" *ngIf="chronicle.id">
            <a [routerLink]="['/admin/chronicles', chronicle.id, 'passages']" class="admin-btn admin-btn-sm">
              Manage Passages →
            </a>
          </div>
        </div>

        <div class="pf-actions">
          <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid || saving">
            {{ saving ? 'SAVING...' : (isEdit ? 'SAVE CHANGES' : 'CREATE') }}
          </button>
          <span class="pf-error" *ngIf="errorMsg">{{ errorMsg }}</span>
          <span class="pf-success" *ngIf="successMsg">{{ successMsg }}</span>
        </div>
      </form>
    </ng-container>
  `,
  styles: [`
    .pf-section {
      background: var(--admin-surface); border: 1px solid var(--admin-border);
      border-radius: var(--admin-radius); padding: 20px; margin-bottom: 12px;
    }
    .pf-section-title {
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      color: var(--admin-neon); margin-bottom: 16px; padding-bottom: 8px;
      border-bottom: 1px solid var(--admin-border); opacity: 0.8;
    }
    .pf-actions { display: flex; align-items: center; gap: 16px; padding: 4px 0 8px; }
    .pf-error { color: var(--admin-danger); font-size: 12px; }
    .pf-success { color: var(--admin-neon); font-size: 12px; }
    .cover-upload-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .cover-upload-error { color: var(--admin-danger); font-size: 12px; }
    .cover-preview {
      margin-top: 8px; border-radius: 4px; overflow: hidden; max-width: 320px;
      border: 1px solid var(--admin-border);
      img { width: 100%; height: 160px; object-fit: cover; display: block; }
    }
    .publish-row { display: flex; align-items: center; gap: 16px; }
    .status-text { font-size: 12px; color: var(--admin-text-muted); letter-spacing: 0.5px; }
    .status-text--live { color: var(--admin-neon); }
    .date-edit-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--admin-border); }
  `],
})
export class ChronicleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminData = inject(AdminDataService);
  private uploadService = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  isEdit = false;
  id: number | null = null;
  chronicle: Chronicle | null = null;
  loaded = false;
  saving = false;
  publishing = false;
  savingDate = false;
  publishedAtDate = '';
  uploadingCover = false;
  coverError = '';
  errorMsg = '';
  successMsg = '';

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    coverImage: [''],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.adminData.getAdminChronicle(this.id).subscribe({
        next: (data) => {
          this.chronicle = data;
          this.form.patchValue({
            title: data.title,
            description: data.description ?? '',
            coverImage: data.coverImage ?? '',
          });
          if (data.publishedAt) this.publishedAtDate = data.publishedAt.slice(0, 10);
          this.loaded = true;
          this.cdr.detectChanges();
        },
        error: () => { this.loaded = true; this.cdr.detectChanges(); },
      });
    } else {
      this.loaded = true;
    }
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = {
      title: val.title!,
      description: val.description || null,
      coverImage: val.coverImage || null,
    };
    this.saving = true; this.errorMsg = ''; this.successMsg = '';

    if (this.isEdit && this.id) {
      this.adminData.updateChronicle(this.id, payload).subscribe({
        next: (data) => {
          this.chronicle = data; this.saving = false; this.successMsg = 'Saved!';
          setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => { this.saving = false; this.errorMsg = err?.error?.message || 'Save failed'; this.cdr.detectChanges(); },
      });
    } else {
      this.adminData.createChronicle(payload).subscribe({
        next: (data) => { this.router.navigate(['/admin/chronicles', data.id]); },
        error: (err) => { this.saving = false; this.errorMsg = err?.error?.message || 'Save failed'; this.cdr.detectChanges(); },
      });
    }
  }

  publish() {
    if (!this.id) return;
    this.publishing = true;
    this.adminData.publishChronicle(this.id).subscribe({
      next: (data) => {
        this.chronicle = data;
        if (data.publishedAt) this.publishedAtDate = data.publishedAt.slice(0, 10);
        this.publishing = false; this.cdr.detectChanges();
      },
      error: (err) => { this.publishing = false; this.errorMsg = err?.error?.message || 'Publish failed'; this.cdr.detectChanges(); },
    });
  }

  saveDate() {
    if (!this.id || !this.publishedAtDate) return;
    this.savingDate = true;
    this.adminData.updateChroniclePublishedAt(this.id, this.publishedAtDate).subscribe({
      next: (data) => {
        this.chronicle = data; this.savingDate = false; this.successMsg = 'Date updated!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 2000);
        this.cdr.detectChanges();
      },
      error: (err) => { this.savingDate = false; this.errorMsg = err?.error?.message || 'Date update failed'; this.cdr.detectChanges(); },
    });
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingCover = true;
    this.coverError = '';
    this.uploadService.upload(file).subscribe({
      next: (url) => {
        this.form.patchValue({ coverImage: url });
        this.uploadingCover = false;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadingCover = false;
        this.coverError = err?.error?.message || 'Upload failed';
        input.value = '';
        this.cdr.detectChanges();
      },
    });
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
