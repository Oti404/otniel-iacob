import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
            <th>Order</th>
            <th>Name</th>
            <th>Status</th>
            <th>Display</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of projects; let i = index">
            <td>
              <div class="admin-order-btns">
                <button (click)="move(p, -1)" [disabled]="i === 0">▲</button>
                <button (click)="move(p, 1)" [disabled]="i === projects.length - 1">▼</button>
              </div>
            </td>
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
})
export class ProjectsListComponent implements OnInit {
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  
  projects: Project[] = [];
  confirmDeleteId: number | null = null;
  toastMsg = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.contentService.getProjects().subscribe(data => {
      this.projects = data.sort((a, b) => a.order - b.order);
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => this.toastMsg = '', 3000);
  }

  move(project: Project, direction: -1 | 1) {
    const newOrder = project.order + direction;
    this.adminDataService.updateProject(project.id, { order: newOrder }).subscribe(() => {
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
