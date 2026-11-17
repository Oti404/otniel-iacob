import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Experience } from '@monorepo/shared';
import { ContentService } from '../../../../core/services/content.service';

const MONTH_YEAR: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };

@Component({
  selector: 'app-experience',
  standalone: true,
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  private content = inject(ContentService);

  readonly experiences = toSignal(this.content.getExperience(), { initialValue: [] as Experience[] });

  period(exp: Experience): string {
    const start = new Date(exp.startDate).toLocaleDateString('en-US', MONTH_YEAR);
    const end = exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', MONTH_YEAR) : 'Present';
    return `${start} – ${end}`;
  }

  splitTech(tech: string): string[] {
    return tech.split(',').map((t) => t.trim()).filter(Boolean);
  }
}
