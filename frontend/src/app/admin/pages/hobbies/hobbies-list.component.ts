import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { Hobby } from '@monorepo/shared';

@Component({
  selector: 'app-hobbies-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-section-header">
      <h2>Hobbies List</h2>
      <button class="admin-btn admin-btn-primary" routerLink="/admin/hobbies/new">+ Add Hobby</button>
    </div>

    <div class="admin-card" *ngIf="hobbies.length > 0; else empty">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Icon</th>
            <th>Name</th>
            <th>Link</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let h of hobbies; let i = index">
            <td>
              <div class="admin-order-btns">
                <button (click)="move(h, -1)" [disabled]="i === 0">▲</button>
                <button (click)="move(h, 1)" [disabled]="i === hobbies.length - 1">▼</button>
              </div>
            </td>
            <td>
              <img [src]="h.icon" alt="icon" style="width:32px; height:32px; object-fit:cover; border-radius:4px; border:1px solid var(--admin-border);">
            </td>
            <td><strong>{{ h.name }}</strong></td>
            <td><a [href]="h.link" target="_blank" style="color:var(--admin-neon);">{{ h.link }}</a></td>
            <td>
              <div class="actions" *ngIf="confirmDeleteId !== h.id">
                <button class="admin-btn admin-btn-sm" [routerLink]="['/admin/hobbies', h.id]">Edit</button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" style="margin-left:8px;" (click)="confirmDeleteId = h.id">Del</button>
              </div>
              <div class="admin-confirm-row" *ngIf="confirmDeleteId === h.id">
                Sure? 
                <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="deleteHobby(h.id)">Yes</button>
                <button class="admin-btn admin-btn-sm" (click)="confirmDeleteId = null">No</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <ng-template #empty>
      <div class="admin-card">No hobbies found. Add one!</div>
    </ng-template>

    <div class="admin-toast toast-success" *ngIf="toastMsg">{{ toastMsg }}</div>
  `,
})
export class HobbiesListComponent implements OnInit {
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  
  hobbies: Hobby[] = [];
  confirmDeleteId: number | null = null;
  toastMsg = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.contentService.getHobbies().subscribe(data => {
      this.hobbies = data.sort((a, b) => a.order - b.order);
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => this.toastMsg = '', 3000);
  }

  move(h: Hobby, direction: -1 | 1) {
    const newOrder = h.order + direction;
    this.adminDataService.updateHobby(h.id, { order: newOrder }).subscribe(() => {
      this.load();
      this.showToast('Order updated');
    });
  }

  deleteHobby(id: number) {
    this.adminDataService.deleteHobby(id).subscribe(() => {
      this.confirmDeleteId = null;
      this.load();
      this.showToast('Hobby deleted');
    });
  }
}
