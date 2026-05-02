import { Component, OnInit } from '@angular/core';
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

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getProjects().subscribe({
      next: (projects) => {
        this.sortedProjects = [...projects].sort((a, b) => {
          if (a.status === 'wip' && b.status !== 'wip') return -1;
          if (a.status !== 'wip' && b.status === 'wip') return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  isContributorLink(c: string | [string, string]): c is [string, string] {
    return Array.isArray(c);
  }
}
