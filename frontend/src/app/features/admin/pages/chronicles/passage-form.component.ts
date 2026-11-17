import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminDataService } from '../../services/admin-data.service';
import { Passage, PassageMedia } from '@monorepo/shared';

@Component({
  selector: 'app-passage-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Passage' : 'New Passage' }}</h2>
      <button class="admin-btn" [routerLink]="['/admin/chronicles', chronicleId, 'passages']">← Passages</button>
    </div>
    
    @if (!loaded) {
      <div class="admin-card" style="color:var(--text-muted);font-size:12px;letter-spacing:1px;">LOADING...</div>
    }
    
    @if (loaded) {
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="pf-section">
          <div class="pf-section-title">Passage Info</div>
          <div class="admin-form-group">
            <label class="admin-label">Title *</label>
            <input type="text" formControlName="title" class="admin-input" placeholder="e.g. Day 1 — Arrival">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Content</label>
            <textarea formControlName="content" class="admin-textarea" rows="10"
            placeholder="Write about this moment... (line breaks are preserved on the site)"></textarea>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Order</label>
            <input type="number" formControlName="order" class="admin-input" style="max-width:100px;" min="0">
          </div>
        </div>
        @if (isEdit && passage) {
          <div class="pf-section">
            <div class="pf-section-title">Publish</div>
            <div class="publish-row">
              <span class="status-text" [class.status-text--live]="passage.publishedAt">
                {{ passage.publishedAt ? '● Published ' + (passage.publishedAt | date:'dd MMM yyyy') : '○ Draft' }}
              </span>
              @if (!passage.publishedAt) {
                <button type="button" class="admin-btn admin-btn-primary"
                  [disabled]="publishing" (click)="publish()">
                  {{ publishing ? 'Publishing...' : 'PUBLISH' }}
                </button>
              }
            </div>
            @if (passage.publishedAt) {
              <div class="date-edit-row">
                <label class="admin-label" style="margin:0;">Published date</label>
                <input type="date" class="admin-input" style="max-width:160px;" [(ngModel)]="publishedAtDate" [ngModelOptions]="{standalone: true}">
                <button type="button" class="admin-btn admin-btn-sm" [disabled]="savingDate" (click)="saveDate()">
                  {{ savingDate ? 'Saving...' : 'Save Date' }}
                </button>
              </div>
            }
          </div>
        }
        <div class="pf-actions">
          <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid || saving">
            {{ saving ? 'SAVING...' : (isEdit ? 'SAVE CHANGES' : 'CREATE PASSAGE') }}
          </button>
          @if (errorMsg) {
            <span class="pf-error">{{ errorMsg }}</span>
          }
          @if (successMsg) {
            <span class="pf-success">{{ successMsg }}</span>
          }
        </div>
      </form>
      <!-- MEDIA — only when editing an existing passage -->
      @if (isEdit) {
        <div class="pf-section">
          <div class="pf-section-title">Media ({{ media.length }})</div>
          @if (media.length > 0) {
            <div class="media-list">
              @for (m of media; track m; let i = $index) {
                <div class="media-row">
                  <div class="media-thumb">
                    @if (m.type === 'IMAGE') {
                      <img [src]="m.url" alt="" (error)="onThumbError($event)">
                    }
                    @if (m.type === 'VIDEO') {
                      <span class="media-icon">▶ VIDEO</span>
                    }
                    @if (m.type === 'YOUTUBE') {
                      <span class="media-icon">▶ YT</span>
                    }
                  </div>
                  <div class="media-info">
                    <span class="media-type">{{ m.type }}</span>
                    @if (m.caption) {
                      <span class="media-caption-text">{{ m.caption }}</span>
                    }
                    <span class="media-url">{{ m.url | slice:0:55 }}{{ m.url.length > 55 ? '...' : '' }}</span>
                  </div>
                  <div class="media-actions">
                    <button class="admin-btn admin-btn-sm" (click)="moveMedia(i, -1)" [disabled]="i === 0">▲</button>
                    <button class="admin-btn admin-btn-sm" (click)="moveMedia(i, 1)" [disabled]="i === media.length - 1">▼</button>
                    @if (confirmDeleteMediaId !== m.id) {
                      <button class="admin-btn admin-btn-sm admin-btn-danger" style="margin-left:4px;"
                      (click)="confirmDeleteMediaId = m.id">Del</button>
                    }
                    @if (confirmDeleteMediaId === m.id) {
                      <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="deleteMedia(m.id)">Yes</button>
                      <button class="admin-btn admin-btn-sm" (click)="confirmDeleteMediaId = null">No</button>
                    }
                  </div>
                </div>
              }
            </div>
          }
          @if (media.length === 0) {
            <p style="color:var(--text-muted);font-size:12px;margin:0 0 20px;">No media yet.</p>
          }
          <!-- Add YouTube -->
          <div class="add-block">
            <div class="add-block-title">Add YouTube Link</div>
            <div class="add-row">
              <input type="url" [(ngModel)]="ytUrl" class="admin-input" placeholder="https://youtube.com/watch?v=..." style="flex:1;">
              <input type="text" [(ngModel)]="ytCaption" class="admin-input" placeholder="Caption (optional)" style="max-width:180px;">
              <button type="button" class="admin-btn admin-btn-primary" [disabled]="!ytUrl || addingYt" (click)="addYoutube()">
                {{ addingYt ? '...' : 'Add' }}
              </button>
            </div>
          </div>
          <!-- Upload file -->
          <div class="add-block" style="margin-top:14px;">
            <div class="add-block-title">Upload Image / Video</div>
            <div class="add-row">
              <input type="text" [(ngModel)]="uploadCaption" class="admin-input" placeholder="Caption (optional)" style="max-width:200px;">
              <label class="admin-btn" style="cursor:pointer;margin:0;">
                Choose File
                <input #fileInput type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                  (change)="onFileSelected($event)" style="display:none;">
              </label>
              @if (selectedFile) {
                <span style="font-size:11px;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  {{ selectedFile.name }}
                </span>
              }
              @if (selectedFile) {
                <button type="button" class="admin-btn admin-btn-primary"
                  [disabled]="uploading" (click)="uploadFile()">
                  {{ uploading ? 'Uploading...' : 'Upload' }}
                </button>
              }
            </div>
            <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block;">
              Max 15 MB — JPEG, PNG, GIF, WebP, MP4, MOV, WebM
            </span>
          </div>
          @if (mediaError) {
            <span class="pf-error" style="margin-top:8px;display:block;">{{ mediaError }}</span>
          }
        </div>
      }
    }
    
    @if (toast) {
      <div class="admin-toast toast-success">{{ toast }}</div>
    }
    `,
  styles: [`
    .pf-section {
      background: var(--surface); border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm); padding: 20px; margin-bottom: 12px;
    }
    .pf-section-title {
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      color: var(--accent); margin-bottom: 16px; padding-bottom: 8px;
      border-bottom: 1px solid var(--border-strong); opacity: 0.8;
    }
    .pf-actions { display: flex; align-items: center; gap: 16px; padding: 4px 0 8px; }
    .pf-error { color: var(--danger); font-size: 12px; }
    .pf-success { color: var(--accent); font-size: 12px; }
    .publish-row { display: flex; align-items: center; gap: 16px; }
    .status-text { font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px; }
    .status-text--live { color: var(--accent); }
    .date-edit-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-strong); }

    .media-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .media-row {
      display: flex; align-items: center; gap: 12px; padding: 8px;
      border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-2);
    }
    .media-thumb {
      width: 72px; height: 52px; border-radius: 4px; overflow: hidden; flex-shrink: 0;
      background: var(--surface); display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border-strong);
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    }
    .media-icon { font-size: 10px; color: var(--accent); font-weight: 700; letter-spacing: 1px; }
    .media-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .media-type { font-size: 10px; letter-spacing: 1px; color: var(--accent); font-weight: 700; }
    .media-caption-text { font-size: 12px; color: var(--text-muted); }
    .media-url { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .media-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

    .add-block { padding-top: 16px; border-top: 1px solid var(--border-strong); margin-top: 4px; }
    .add-block-title {
      font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--text-muted); margin-bottom: 10px;
    }
    .add-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  `],
})
export class PassageFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminData = inject(AdminDataService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  chronicleId!: number;
  passageId: number | null = null;
  isEdit = false;
  passage: Passage | null = null;
  media: PassageMedia[] = [];
  loaded = false;

  saving = false;
  publishing = false;
  savingDate = false;
  publishedAtDate = '';
  errorMsg = '';
  successMsg = '';
  toast = '';

  ytUrl = '';
  ytCaption = '';
  addingYt = false;

  selectedFile: File | null = null;
  uploadCaption = '';
  uploading = false;
  mediaError = '';

  confirmDeleteMediaId: number | null = null;

  form = this.fb.group({
    title: ['', Validators.required],
    content: [''],
    order: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.chronicleId = Number(this.route.snapshot.paramMap.get('id'));
    const pidParam = this.route.snapshot.paramMap.get('pid');
    if (pidParam) {
      this.isEdit = true;
      this.passageId = +pidParam;
      this.loadPassage();
    } else {
      this.loaded = true;
    }
  }

  loadPassage() {
    this.adminData.getAdminChronicle(this.chronicleId).subscribe({
      next: (chronicle) => {
        const p = (chronicle.passages ?? []).find((x) => x.id === this.passageId);
        if (p) {
          this.passage = p;
          this.media = [...p.media].sort((a, b) => a.order - b.order);
          this.form.patchValue({ title: p.title, content: p.content ?? '', order: p.order });
          if (p.publishedAt) this.publishedAtDate = p.publishedAt.slice(0, 10);
        }
        this.loaded = true;
        this.cdr.detectChanges();
      },
      error: () => { this.loaded = true; this.cdr.detectChanges(); },
    });
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = { title: val.title!, content: val.content || null, order: Number(val.order ?? 0) };
    this.saving = true; this.errorMsg = ''; this.successMsg = '';

    if (this.isEdit && this.passageId) {
      this.adminData.updatePassage(this.passageId, payload).subscribe({
        next: (data) => {
          this.passage = { ...this.passage!, ...data };
          this.saving = false; this.successMsg = 'Saved!';
          setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 2000);
          this.cdr.detectChanges();
        },
        error: (err) => { this.saving = false; this.errorMsg = err?.error?.message || 'Save failed'; this.cdr.detectChanges(); },
      });
    } else {
      this.adminData.createPassage(this.chronicleId, payload).subscribe({
        next: (data) => { this.router.navigate(['/admin/chronicles', this.chronicleId, 'passages', data.id]); },
        error: (err) => { this.saving = false; this.errorMsg = err?.error?.message || 'Save failed'; this.cdr.detectChanges(); },
      });
    }
  }

  publish() {
    if (!this.passageId) return;
    this.publishing = true;
    this.adminData.publishPassage(this.passageId).subscribe({
      next: (data) => {
        this.passage = { ...this.passage!, publishedAt: data.publishedAt };
        if (data.publishedAt) this.publishedAtDate = data.publishedAt.slice(0, 10);
        this.publishing = false; this.cdr.detectChanges();
      },
      error: (err) => { this.publishing = false; this.errorMsg = err?.error?.message || 'Publish failed'; this.cdr.detectChanges(); },
    });
  }

  saveDate() {
    if (!this.passageId || !this.publishedAtDate) return;
    this.savingDate = true;
    this.adminData.updatePassagePublishedAt(this.passageId, this.publishedAtDate).subscribe({
      next: (data) => {
        this.passage = { ...this.passage!, publishedAt: data.publishedAt }; this.savingDate = false; this.successMsg = 'Date updated!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 2000);
        this.cdr.detectChanges();
      },
      error: (err) => { this.savingDate = false; this.errorMsg = err?.error?.message || 'Date update failed'; this.cdr.detectChanges(); },
    });
  }

  addYoutube() {
    if (!this.ytUrl || !this.passageId) return;
    this.addingYt = true; this.mediaError = '';
    this.adminData.addYoutubeLink(this.passageId, { url: this.ytUrl, caption: this.ytCaption || null, order: this.media.length }).subscribe({
      next: (m) => {
        this.media.push(m); this.ytUrl = ''; this.ytCaption = '';
        this.addingYt = false; this.showToast('YouTube link added'); this.cdr.detectChanges();
      },
      error: (err) => { this.addingYt = false; this.mediaError = err?.error?.message || 'Failed to add link'; this.cdr.detectChanges(); },
    });
  }

  onFileSelected(event: Event) {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.cdr.detectChanges();
  }

  uploadFile() {
    if (!this.selectedFile || !this.passageId) return;
    this.uploading = true; this.mediaError = '';
    this.adminData.uploadPassageMedia(this.passageId, this.selectedFile, this.uploadCaption || null).subscribe({
      next: (m) => {
        this.media.push(m);
        this.selectedFile = null; this.uploadCaption = '';
        if (this.fileInput) this.fileInput.nativeElement.value = '';
        this.uploading = false; this.showToast('File uploaded'); this.cdr.detectChanges();
      },
      error: (err) => { this.uploading = false; this.mediaError = err?.error?.message || 'Upload failed'; this.cdr.detectChanges(); },
    });
  }

  moveMedia(i: number, direction: -1 | 1) {
    const j = i + direction;
    forkJoin([
      this.adminData.reorderMedia(this.media[i].id, this.media[j].order),
      this.adminData.reorderMedia(this.media[j].id, this.media[i].order),
    ]).subscribe({
      next: () => {
        [this.media[i], this.media[j]] = [this.media[j], this.media[i]];
        this.cdr.detectChanges();
      },
    });
  }

  deleteMedia(mid: number) {
    this.adminData.deleteMedia(mid).subscribe({
      next: () => {
        this.media = this.media.filter((m) => m.id !== mid);
        this.confirmDeleteMediaId = null;
        this.showToast('Media deleted'); this.cdr.detectChanges();
      },
      error: (err) => { this.mediaError = err?.error?.message || 'Delete failed'; this.cdr.detectChanges(); },
    });
  }

  onThumbError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  showToast(msg: string) {
    this.toast = msg; this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
