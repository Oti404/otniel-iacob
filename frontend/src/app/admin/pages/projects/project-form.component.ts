import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>{{ isEdit ? 'Edit Project' : 'New Project' }}</h2>
      <button class="admin-btn" routerLink="/admin/projects">Back to List</button>
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
        <label class="admin-label">Tech Stack</label>
        <input type="text" formControlName="tech" class="admin-input" placeholder="e.g. React, Node.js, AWS">
      </div>

      <div style="display:flex; gap:16px;">
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">GitHub Link (optional)</label>
          <input type="url" formControlName="link" class="admin-input">
        </div>
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">Live Link (optional)</label>
          <input type="url" formControlName="liveLink" class="admin-input">
        </div>
      </div>

      <div style="display:flex; gap:16px;">
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">Start Date</label>
          <input type="date" formControlName="date" class="admin-input">
        </div>
        <div class="admin-form-group" style="flex:1;">
          <label class="admin-label">End Date (optional)</label>
          <input type="date" formControlName="endDate" class="admin-input">
        </div>
      </div>

      <div style="display:flex; gap:16px; align-items:center;">
        <div class="admin-form-group">
          <label class="admin-label">Status</label>
          <select formControlName="status" class="admin-select">
            <option value="completed">Completed</option>
            <option value="wip">WIP</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div class="admin-form-group">
          <label class="admin-label">Order</label>
          <input type="number" formControlName="order" class="admin-input" style="width:80px;">
        </div>

        <div class="admin-form-group" style="flex-direction:row; align-items:center;">
          <input type="checkbox" formControlName="display" class="admin-checkbox" id="display">
          <label class="admin-label" for="display" style="margin-left:8px;">Visible to Public</label>
        </div>
      </div>

      <div class="admin-form-group" style="margin-top: 16px;">
        <label class="admin-label">Contributors (Strings or Links)</label>
        <div formArrayName="contributors" class="admin-dynamic-list">
          <div *ngFor="let c of contributorsArray.controls; let i=index" class="dynamic-item">
            <!-- If the contributor is a string -->
            <input *ngIf="c.value === null || typeof(c.value) === 'string'; else linkTemplate" type="text" [formControlName]="i" class="admin-input" placeholder="Name">
            
            <ng-template #linkTemplate>
               <input type="text" [value]="c.value[0]" disabled class="admin-input" style="flex:0.4;">
               <input type="text" [value]="c.value[1]" disabled class="admin-input" style="flex:0.6;">
            </ng-template>

            <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" (click)="removeContributor(i)">X</button>
          </div>
        </div>
        <div style="margin-top: 8px;">
           <button type="button" class="admin-btn admin-btn-sm" (click)="addContributorString()">+ Add Text</button>
        </div>
      </div>

      <div class="admin-form-group" style="margin-top: 24px;">
        <button type="submit" class="admin-btn admin-btn-primary" [disabled]="form.invalid">SAVE PROJECT</button>
      </div>
    </form>
  `
})
export class ProjectFormComponent implements OnInit {
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
    tech: ['', Validators.required],
    link: [''],
    liveLink: [''],
    date: ['', Validators.required],
    endDate: [''],
    status: ['completed', Validators.required],
    order: [0, Validators.required],
    display: [true],
    contributors: this.fb.array([])
  });

  get contributorsArray() {
    return this.form.get('contributors') as FormArray;
  }

  typeof(val: any) { return typeof val; }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.contentService.getProjects().subscribe(projects => {
        const p = projects.find(x => x.id === this.id);
        if (p) {
          this.form.patchValue({
            name: p.name,
            description: p.description,
            tech: p.tech,
            link: p.link || '',
            liveLink: p.liveLink || '',
            date: p.date ? p.date.substring(0, 10) : '',
            endDate: p.endDate ? p.endDate.substring(0, 10) : '',
            status: p.status,
            order: p.order,
            display: p.display,
          });
          if (p.contributors && Array.isArray(p.contributors)) {
            p.contributors.forEach(c => this.contributorsArray.push(new FormControl(c)));
          }
        }
        this.loaded = true;
      });
    } else {
      this.loaded = true;
    }
  }

  addContributorString() {
    this.contributorsArray.push(new FormControl(''));
  }

  removeContributor(index: number) {
    this.contributorsArray.removeAt(index);
  }

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload = {
      ...val,
      date: new Date(val.date!).toISOString(),
      endDate: val.endDate ? new Date(val.endDate).toISOString() : null,
      link: val.link || null,
      liveLink: val.liveLink || null,
    };

    if (this.isEdit && this.id) {
      this.adminDataService.updateProject(this.id, payload as any).subscribe(() => {
        this.router.navigate(['/admin/projects']);
      });
    } else {
      this.adminDataService.createProject(payload as any).subscribe(() => {
        this.router.navigate(['/admin/projects']);
      });
    }
  }
}
