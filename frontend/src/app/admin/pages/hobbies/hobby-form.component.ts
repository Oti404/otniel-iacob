import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';

@Component({
  selector: 'app-hobby-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FileUploadComponent],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Hobby' : 'New Hobby' }}</h2>
      <button class="admin-btn" routerLink="/admin/hobbies">Back to List</button>
    </div>

    <form [formGroup]="form" (ngSubmit)="save()" class="admin-card" *ngIf="loaded">
      <div class="admin-form-group">
        <label class="admin-label">Name</label>
        <input type="text" formControlName="name" class="admin-input">
      </div>

      <div class="admin-form-group">
        <label class="admin-label">Description</label>
        <textarea formControlName="description" class="admin-textarea"></textarea>
      </div>

      <div class="admin-form-group">
        <label class="admin-label">Link (Optional)</label>
        <input type="url" formControlName="link" class="admin-input">
      </div>

      <div class="admin-form-group">
        <label class="admin-label">Order</label>
        <input type="number" formControlName="order" class="admin-input" style="width:80px;">
      </div>

      <div class="admin-form-group" style="margin-top: 16px;">
        <app-file-upload 
          label="Hobby Icon (Image)" 
          accept="image/*" 
          [currentUrl]="form.value.icon || ''"
          (uploaded)="form.patchValue({ icon: $event })">
        </app-file-upload>
      </div>

      <div class="admin-form-group" style="margin-top: 24px;">
        <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid">SAVE HOBBY</button>
      </div>
    </form>
  `
})
export class HobbyFormComponent implements OnInit {
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);

  isEdit = false;
  id: number | null = null;
  loaded = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['', Validators.required],
    link: [''],
    order: [0, Validators.required],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.contentService.getHobbies().subscribe(hobbies => {
        const h = hobbies.find(x => x.id === this.id);
        if (h) {
          this.form.patchValue({
            name: h.name,
            description: h.description,
            icon: h.icon,
            link: h.link || '',
            order: h.order,
          });
        }
        this.loaded = true;
      });
    } else {
      this.loaded = true;
    }
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = {
      ...val,
      link: val.link || '#',
    };

    if (this.isEdit && this.id) {
      this.adminDataService.updateHobby(this.id, payload as any).subscribe(() => {
        this.router.navigate(['/admin/hobbies']);
      });
    } else {
      this.adminDataService.createHobby(payload as any).subscribe(() => {
        this.router.navigate(['/admin/hobbies']);
      });
    }
  }
}
