import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Experience' : 'New Experience' }}</h2>
      <button class="admin-btn" routerLink="/admin/experience">Back to List</button>
    </div>

    <form [formGroup]="form" (ngSubmit)="save()" class="admin-card" *ngIf="loaded">
      <div style="display:flex; gap:16px;">
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">Company / Institution</label>
          <input type="text" formControlName="company" class="admin-input">
        </div>
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">Role</label>
          <input type="text" formControlName="role" class="admin-input">
        </div>
      </div>

      <div class="admin-form-group">
        <label class="admin-label">Tech Stack</label>
        <input type="text" formControlName="tech" class="admin-input" placeholder="e.g. Angular, C#, Docker">
      </div>

      <div style="display:flex; gap:16px;">
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">Start Date</label>
          <input type="date" formControlName="startDate" class="admin-input">
        </div>
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">End Date (optional)</label>
          <input type="date" formControlName="endDate" class="admin-input">
        </div>
      </div>

      <div style="display:flex; gap:16px; align-items:center;">
        <div class="admin-form-group">
          <label class="admin-label">Type</label>
          <select formControlName="type" class="admin-select">
            <option value="job">Job</option>
            <option value="education">Education</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div class="admin-form-group">
          <label class="admin-label">Order</label>
          <input type="number" formControlName="order" class="admin-input" style="width:80px;">
        </div>
      </div>

      <div class="admin-form-group" style="margin-top: 16px;">
        <label class="admin-label">Description (Bullet points)</label>
        <div formArrayName="description" class="admin-dynamic-list">
          <div *ngFor="let c of descriptionArray.controls; let i=index" class="dynamic-item">
            <input type="text" [formControlName]="i" class="admin-input" placeholder="Bullet point text...">
            <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" (click)="removeDescription(i)">X</button>
          </div>
        </div>
        <div style="margin-top: 8px;">
           <button type="button" class="admin-btn admin-btn-sm" (click)="addDescription()">+ Add Point</button>
        </div>
      </div>

      <div class="admin-form-group" style="margin-top: 24px;">
        <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid">SAVE EXPERIENCE</button>
      </div>
    </form>
  `
})
export class ExperienceFormComponent implements OnInit {
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);

  isEdit = false;
  id: number | null = null;
  loaded = false;

  form = this.fb.group({
    company: ['', Validators.required],
    role: ['', Validators.required],
    tech: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    type: ['job', Validators.required],
    order: [0, Validators.required],
    description: this.fb.array([])
  });

  get descriptionArray() {
    return this.form.get('description') as FormArray;
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.contentService.getExperience().subscribe(experiences => {
        const ex = experiences.find(x => x.id === this.id);
        if (ex) {
          this.form.patchValue({
            company: ex.company,
            role: ex.role,
            tech: ex.tech,
            startDate: ex.startDate ? ex.startDate.substring(0, 10) : '',
            endDate: ex.endDate ? ex.endDate.substring(0, 10) : '',
            type: ex.type,
            order: ex.order,
          });
          if (ex.description && Array.isArray(ex.description)) {
            ex.description.forEach(desc => this.descriptionArray.push(new FormControl(desc)));
          }
        }
        this.loaded = true;
      });
    } else {
      this.addDescription(); // Add one empty point by default
      this.loaded = true;
    }
  }

  addDescription() {
    this.descriptionArray.push(new FormControl('', Validators.required));
  }

  removeDescription(index: number) {
    this.descriptionArray.removeAt(index);
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = {
      ...val,
      startDate: new Date(val.startDate!).toISOString(),
      endDate: val.endDate ? new Date(val.endDate).toISOString() : null,
    };

    if (this.isEdit && this.id) {
      this.adminDataService.updateExperience(this.id, payload as any).subscribe(() => {
        this.router.navigate(['/admin/experience']);
      });
    } else {
      this.adminDataService.createExperience(payload as any).subscribe(() => {
        this.router.navigate(['/admin/experience']);
      });
    }
  }
}
