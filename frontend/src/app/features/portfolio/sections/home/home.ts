import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../../../core/services/content.service';
import { IconComponent } from '../../../../shared/ui/icon.component';

interface Orbiter { label: string; ring: 1 | 2; angle: number; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgOptimizedImage, IconComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private content = inject(ContentService);

  readonly profile = toSignal(this.content.getProfile(), { initialValue: null });
  readonly avatar = computed(() => this.profile()?.avatar || 'assets/tech-core.webp');

  /** The core stack only — fewer labels so the headline stays the focus. */
  readonly orbiters: Orbiter[] = [
    { label: 'Angular', ring: 1, angle: -60 },
    { label: 'TypeScript', ring: 1, angle: 60 },
    { label: 'Node.js', ring: 1, angle: 180 },
    { label: 'SQL', ring: 2, angle: 0 },
    { label: 'Java', ring: 2, angle: 120 },
    { label: 'Python', ring: 2, angle: 240 },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
