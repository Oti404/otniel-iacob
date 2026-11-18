import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/ui/icon.component';

interface NavLink { id: string; label: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements AfterViewInit {
  readonly links: NavLink[] = [
    { id: 'home', label: 'Home' },
    { id: 'about-me', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
  ];

  readonly menuOpen = signal(false);
  readonly active = signal('home');

  private destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    // Highlight the section that occupies the middle band of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.active.set(e.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const l of this.links) {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  go(id: string): void {
    this.closeMenu();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
