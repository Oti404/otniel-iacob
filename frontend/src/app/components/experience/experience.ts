import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  private content = inject(ContentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.content.getExperience().subscribe({
      next: (data) => { this.experiences = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
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
