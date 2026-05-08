import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Project } from '@monorepo/shared';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements OnInit {
  sortedProjects: Project[] = [];
  loading = true;
  private content = inject(ContentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.content.getProjects().subscribe({
      next: (projects) => {
        this.sortedProjects = [...projects].sort((a, b) => a.order - b.order);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  expanded: Record<number, boolean> = {};

  toggle(id: number) {
    this.expanded[id] = !this.expanded[id];
    this.cdr.detectChanges();
  }

  splitTech(tech: string): string[] {
    return tech.split(',').map(t => t.trim()).filter(Boolean);
  }

}
