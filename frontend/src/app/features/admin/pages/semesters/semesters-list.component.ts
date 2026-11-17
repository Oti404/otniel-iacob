import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ContentService } from '../../../../core/services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { Semester, Subject } from '@monorepo/shared';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';

@Component({
  selector: 'app-semesters-list',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FileUploadComponent],
  template: `
    <div class="admin-section-header">
      <h2>Semesters & Subjects List</h2>
      @if (!addingSemester) {
        <button class="admin-btn admin-btn-primary" (click)="addingSemester = true">+ Add Semester</button>
      }
    </div>
    
    <!-- Add Semester Inline Form -->
    @if (addingSemester) {
      <div class="admin-card" style="margin-bottom: 16px; border-color: var(--accent);">
        <div style="display:flex; gap:16px; align-items:center;">
          <input type="text" [(ngModel)]="newSem.id" class="admin-input" placeholder="ID (e.g. 2026-s1)" style="flex:1;">
          <input type="text" [(ngModel)]="newSem.name" class="admin-input" placeholder="Name (e.g. Year 3, Semester 1)" style="flex:2;">
          <input type="number" [(ngModel)]="newSem.order" class="admin-input" placeholder="Order" style="flex:0.5;">
          <button class="admin-btn admin-btn-primary" (click)="saveNewSemester()">Save</button>
          <button class="admin-btn admin-btn-danger" (click)="addingSemester = false">Cancel</button>
        </div>
      </div>
    }
    
    @if (semesters.length > 0) {
      <div class="admin-card">
        @for (sem of semesters; track sem; let i = $index) {
          <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-strong);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
              <div style="display:flex; align-items:center; gap: 12px; flex:1;">
                <div class="admin-order-btns">
                  <button (click)="moveSem(sem, -1)" [disabled]="i === 0">▲</button>
                  <button (click)="moveSem(sem, 1)" [disabled]="i === semesters.length - 1">▼</button>
                </div>
                <!-- Edit mode for Semester -->
                @if (editSemId !== sem.id) {
                  <h3 style="margin:0; color:var(--accent);">{{ sem.name }} <span style="color:var(--text-muted); font-size:10px;">({{ sem.id }})</span></h3>
                } @else {
                  <input type="text" [(ngModel)]="editSemData.name" class="admin-input" style="width:200px;">
                  <button class="admin-btn admin-btn-sm admin-btn-primary" (click)="saveSemEdit(sem.id)">Save</button>
                  <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="editSemId = null">Cancel</button>
                }
              </div>
              <div class="actions">
                @if (editSemId !== sem.id) {
                  <button class="admin-btn admin-btn-sm" (click)="startEditSem(sem)">Rename</button>
                }
                <button class="admin-btn admin-btn-sm admin-btn-accent" style="margin-left:8px;" (click)="toggleSubjects(sem.id)">
                  {{ expandedSemId === sem.id ? 'Hide Subjects' : 'Manage Subjects (' + sem.subjects.length + ')' }}
                </button>
                <button class="admin-btn admin-btn-sm admin-btn-danger" style="margin-left:8px;" (click)="deleteSemester(sem.id)">Delete Sem</button>
              </div>
            </div>
            <!-- SUBJECTS PANEL -->
            @if (expandedSemId === sem.id) {
              <div style="background: var(--surface-2); padding: 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-2);">
                <!-- Existing Subjects Table -->
                @if (sem.subjects.length > 0) {
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Credits</th>
                        <th>Passed</th>
                        <th>PDF Material</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sub of sem.subjects; track sub) {
                        <tr>
                          <td>{{ sub.code }}</td>
                          <td>{{ sub.name }}</td>
                          <td>{{ sub.credits }}</td>
                          <td>
                            <input type="checkbox" class="admin-checkbox" [checked]="sub.passed" (change)="togglePassed(sub)">
                          </td>
                          <td>
                            <app-file-upload
                              label=""
                              accept=".pdf"
                              [currentUrl]="sub.docPath || ''"
                              (uploaded)="updateDoc(sub, $event)">
                            </app-file-upload>
                          </td>
                          <td>
                            <button class="admin-btn admin-btn-sm admin-btn-danger" (click)="deleteSubject(sub.id)">Del</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
                @if (sem.subjects.length === 0) {
                  <p style="color:var(--text-muted); font-size:12px;">No subjects yet.</p>
                }
                <!-- Add Subject Form -->
                <div style="margin-top: 16px; display:flex; gap:8px; align-items:center;">
                  <input type="text" [(ngModel)]="newSub.code" class="admin-input" placeholder="Code (e.g. CS101)">
                  <input type="text" [(ngModel)]="newSub.name" class="admin-input" placeholder="Name">
                  <input type="number" [(ngModel)]="newSub.credits" class="admin-input" placeholder="Cr" style="width:60px;">
                  <label style="font-size:11px; display:flex; align-items:center; gap:4px; color:var(--accent);">
                    <input type="checkbox" [(ngModel)]="newSub.passed" class="admin-checkbox"> Passed
                  </label>
                  <button class="admin-btn admin-btn-sm admin-btn-primary" (click)="saveNewSubject(sem.id)">+ Add</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="admin-card">No semesters found. Add one!</div>
    }
    
    
    @if (toastMsg) {
      <div class="admin-toast toast-success">{{ toastMsg }}</div>
    }
    `,
})
export class SemestersListComponent implements OnInit {
  contentService = inject(ContentService);
  adminDataService = inject(AdminDataService);
  cdr = inject(ChangeDetectorRef);

  semesters: Semester[] = [];
  toastMsg = '';

  expandedSemId: string | null = null;
  addingSemester = false;
  newSem = { id: '', name: '', order: 0 };
  
  editSemId: string | null = null;
  editSemData = { name: '' };

  newSub = { code: '', name: '', credits: 5, passed: false };

  ngOnInit() {
    this.load();
  }

  load() {
    this.contentService.getSemesters().subscribe(data => {
      this.semesters = data.sort((a, b) => a.order - b.order);
      this.semesters.forEach(s => s.subjects.sort((a, b) => a.code.localeCompare(b.code)));
      this.cdr.detectChanges();
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 3000);
  }

  // --- SEMESTERS ---

  saveNewSemester() {
    if (!this.newSem.id || !this.newSem.name) return;
    this.adminDataService.createSemester(this.newSem).subscribe(() => {
      this.addingSemester = false;
      this.newSem = { id: '', name: '', order: this.semesters.length };
      this.load();
      this.showToast('Semester added');
    });
  }

  deleteSemester(id: string) {
    if(confirm('Delete semester and ALL its subjects?')) {
      this.adminDataService.deleteSemester(id).subscribe(() => {
        this.load();
        this.showToast('Semester deleted');
      });
    }
  }

  moveSem(sem: Semester, direction: -1 | 1) {
    const newOrder = sem.order + direction;
    this.adminDataService.updateSemester(sem.id, { order: newOrder }).subscribe(() => {
      this.load();
    });
  }

  startEditSem(sem: Semester) {
    this.editSemId = sem.id;
    this.editSemData.name = sem.name;
  }

  saveSemEdit(id: string) {
    this.adminDataService.updateSemester(id, { name: this.editSemData.name }).subscribe(() => {
      this.editSemId = null;
      this.load();
    });
  }

  toggleSubjects(id: string) {
    if (this.expandedSemId === id) this.expandedSemId = null;
    else this.expandedSemId = id;
  }

  // --- SUBJECTS ---

  saveNewSubject(semesterId: string) {
    if (!this.newSub.code || !this.newSub.name) return;
    this.adminDataService.createSubject({
      ...this.newSub,
      semesterId
    }).subscribe(() => {
      this.newSub = { code: '', name: '', credits: 5, passed: false };
      this.load();
      this.showToast('Subject added');
    });
  }

  deleteSubject(id: number) {
    if(confirm('Delete subject?')) {
      this.adminDataService.deleteSubject(id).subscribe(() => {
        this.load();
      });
    }
  }

  togglePassed(sub: Subject) {
    this.adminDataService.updateSubject(sub.id, { passed: !sub.passed }).subscribe(() => {
      this.load();
    });
  }

  updateDoc(sub: Subject, url: string) {
    this.adminDataService.updateSubject(sub.id, { docPath: url }).subscribe(() => {
      this.load();
      this.showToast('Document updated');
    });
  }
}
