import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../../../core/services/content.service';
import { IconComponent, IconName } from '../../../../shared/ui/icon.component';

interface Detail {
  icon: IconName;
  label: string;
  value: string;
  href: string | null;
  external: boolean;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  private content = inject(ContentService);

  readonly profile = toSignal(this.content.getProfile(), { initialValue: null });

  readonly details = computed<Detail[]>(() => {
    const p = this.profile();
    if (!p) return [];
    const handle = (url: string) => url.replace(/\/+$/, '').split('/').pop() ?? url;
    return [
      { icon: 'linkedin', label: 'LinkedIn', value: handle(p.linkedin), href: p.linkedin, external: true },
      { icon: 'github', label: 'GitHub', value: handle(p.github), href: p.github, external: true },
      { icon: 'mail', label: 'Email', value: p.email, href: `mailto:${p.email}`, external: false },
      { icon: 'map-pin', label: 'Location', value: p.location, href: null, external: false },
      { icon: 'file', label: 'Resume', value: 'Download PDF', href: p.cvPdf, external: true },
    ];
  });
}
