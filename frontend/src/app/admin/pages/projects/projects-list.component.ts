import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { Project } from '@monorepo/shared';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>Projects List</h2>
      <button class="admin-btn admin-btn-primary" routerLink="/admin/projects/new">+ Add Project</button>
    </div>

    <div class="admin-card" *ngIf="projects.length > 0; else empty">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:32px;"></th>
            <th>Name</th>
            <th>Status</th>
            <th>Display</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of projects; let i = index"
              draggable="true"
              (dragstart)="onDragStart(i)"
              (dragover)="onDragOver($event, i)"
              (drop)="onDrop(i)"
              (dragend)="dragOverIndex = null"
              [class.drag-over]="dragOverIndex === i"
              style="cursor: grab;">
            <td style="color:#555; font-size:18px; user-select:none;">⠿</td>
            <td><strong>{{ p.name }}</strong></td>
            <td><span class="admin-badge badge-{{ p.status }}">{{ p.status }}</span></td>
            <td>
              <span class="admin-badge" [class.badge-on]="p.display" [class.badge-off]="!p.display">
                {{ p.display ? 'ON' : 'OFF' }}
              </span>
            </td>
            <td>{{ p.date | date:'yyyy-MM-dd' }}</td>
            <td>
              <div class="actions" *ngIf="confirmDeleteId !== p.id">
                <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/projects', p.id]">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" style="margin-left:8px;" (click)="confirmDeleteId = p.id">Del</button>
              </div>
              <div class="admin-confirm-row" *ngIf="confirmDeleteId === p.id">
                Sure?
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="deleteProject(p.id)">Yes</button>
                <button class="admin-btn admin-btn-sm" (click)="confirmDeleteId = null">No</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #empty>
      <div class="admin-card">No projects found. Add one!</div>
    </ng-template>

    <div class="admin-toast toast-success" *ngIf="toastMsg">{{ toastMsg }}</div>
  `,
  styles: [`
    tr.drag-over td { background: rgba(0,255,170,0.08); }
  `],
})
export class ProjectsListComponent implements OnInit {
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  cdr = inject(ChangeDetectorRef);

  projects: Project[] = [];
  confirmDeleteId: number | null = null;
  toastMsg = '';
  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.contentService.getProjects().subscribe(data => {
      this.projects = data.sort((a, b) => a.order - b.order);
      this.cdr.detectChanges();
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 3000);
  }

  onDragStart(index: number) {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex = index;
    this.cdr.detectChanges();
  }

  onDrop(dropIndex: number) {
    const fromIndex = this.dragIndex;
    this.dragIndex = null;
    this.dragOverIndex = null;
    if (fromIndex === null || fromIndex === dropIndex) return;

    const from = this.projects[fromIndex];
    const to = this.projects[dropIndex];
    forkJoin([
      this.adminDataService.updateProject(from.id, { order: to.order }),
      this.adminDataService.updateProject(to.id, { order: from.order }),
    ]).subscribe(() => {
      this.load();
      this.showToast('Order updated');
    });
  }

  deleteProject(id: number) {
    this.adminDataService.deleteProject(id).subscribe(() => {
      this.confirmDeleteId = null;
      this.load();
      this.showToast('Project deleted');
    });
  }
}
