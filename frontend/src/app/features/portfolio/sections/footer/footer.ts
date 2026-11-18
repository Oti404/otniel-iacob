import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../../../core/services/content.service';
import { IconComponent } from '../../../../shared/ui/icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private content = inject(ContentService);

  readonly profile = toSignal(this.content.getProfile(), { initialValue: null });
  readonly year = new Date().getFullYear();

  readonly sections = [
    { id: 'home', label: 'Home' },
    { id: 'about-me', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
  ];

  go(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
