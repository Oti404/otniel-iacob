import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Experience } from '@monorepo/shared';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [];
  loading = true;

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getExperience().subscribe({
      next: (data) => { this.experiences = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  formatPeriod(exp: Experience): string {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const start = new Date(exp.startDate).toLocaleDateString('en-US', opts);
    if (!exp.endDate) return `${start} - Present`;
    const end = new Date(exp.endDate).toLocaleDateString('en-US', opts);
    return `${start} - ${end}`;
  }
}
