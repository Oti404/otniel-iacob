import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PassageMedia } from '@monorepo/shared';
import { CloudinaryImagePipe } from '../../../shared/pipes/cloudinary-image.pipe';
import { IconComponent } from '../../../shared/ui/icon.component';

type Slide = PassageMedia & { embedUrl?: SafeResourceUrl };

/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
const SWIPE_PX = 45;

@Component({
  selector: 'app-media-carousel',
  standalone: true,
  imports: [CloudinaryImagePipe, IconComponent],
  templateUrl: './media-carousel.component.html',
  styleUrl: './media-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCarouselComponent {
  private sanitizer = inject(DomSanitizer);

  readonly media = input.required<PassageMedia[]>();
  /** Used for alt text when a slide has no caption. */
  readonly title = input('');

  readonly current = signal(0);

  readonly slides = computed<Slide[]>(() =>
    this.media().map((m) => ({ ...m, embedUrl: m.type === 'YOUTUBE' ? this.toEmbedUrl(m.url) : undefined })),
  );
  readonly count = computed(() => this.slides().length);
  readonly multiple = computed(() => this.count() > 1);

  next(): void {
    this.current.update((i) => (i + 1) % this.count());
  }

  prev(): void {
    this.current.update((i) => (i - 1 + this.count()) % this.count());
  }

  goTo(i: number): void {
    this.current.set(i);
  }

  onKeydown(e: KeyboardEvent): void {
    if (!this.multiple()) return;
    if (e.key === 'ArrowRight') { this.next(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { this.prev(); e.preventDefault(); }
  }

  // ─── Touch / swipe ────────────────────────────────────────────────────────
  private startX = 0;
  private startY = 0;

  onTouchStart(e: TouchEvent): void {
    const t = e.changedTouches[0];
    if (!t) return;
    this.startX = t.clientX;
    this.startY = t.clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    const t = e.changedTouches[0];
    if (!t || !this.multiple()) return;
    const dx = t.clientX - this.startX;
    const dy = t.clientY - this.startY;
    // Only a deliberate, mostly horizontal swipe; vertical page scroll passes through.
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) this.next();
    else this.prev();
  }

  private toEmbedUrl(url: string): SafeResourceUrl | undefined {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)?.[1] ?? '';
    // Only trust a strictly-shaped 11-char YouTube id — never interpolate raw
    // input into the URL handed to bypassSecurityTrustResourceUrl.
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return undefined;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }
}
