import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Project } from '@monorepo/shared';
import { ContentService } from '../../../../core/services/content.service';
import { IconComponent } from '../../../../shared/ui/icon.component';

/** Descriptions longer than this are collapsed behind "more". */
const COLLAPSE_AT = 180;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [DatePipe, IconComponent],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects {
  private content = inject(ContentService);

  private readonly projects = toSignal(this.content.getProjects(), { initialValue: [] as Project[] });
  readonly sorted = computed(() => [...this.projects()].sort((a, b) => a.order - b.order));
  readonly expanded = signal<ReadonlySet<number>>(new Set());

  isLong(p: Project): boolean {
    return p.description.length > COLLAPSE_AT;
  }

  isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  toggle(id: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  splitTech(tech: string): string[] {
    return tech.split(',').map((t) => t.trim()).filter(Boolean);
  }

  hasCode(p: Project): boolean {
    return !!p.link && p.link !== '#';
  }
}
