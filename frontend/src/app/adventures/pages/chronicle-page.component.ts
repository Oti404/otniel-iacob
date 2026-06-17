import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChroniclesService } from '../../services/chronicles.service';
import { Chronicle, Passage, PassageMedia } from '@monorepo/shared';
import { SubscribePanelComponent } from '../components/subscribe-panel.component';
import { CloudinaryImagePipe } from '../../shared/cloudinary-image.pipe';

type ProcessedMedia = PassageMedia & { embedUrl?: SafeResourceUrl };
type ProcessedPassage = Omit<Passage, 'media'> & { media: ProcessedMedia[]; currentSlide: number };

@Component({
  selector: 'app-chronicle-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SubscribePanelComponent, CloudinaryImagePipe],
  templateUrl: './chronicle-page.component.html',
  styleUrl: './chronicle-page.component.scss',
})
export class ChroniclePageComponent implements OnInit {
  private service = inject(ChroniclesService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  readonly chronicle = signal<Chronicle | null>(null);
  readonly passages = signal<ProcessedPassage[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getChronicle(id).subscribe({
      next: (data) => {
        this.chronicle.set(data);
        this.passages.set((data.passages ?? []).map((p) => ({
          ...p,
          currentSlide: 0,
          media: p.media.map((m) => ({
            ...m,
            embedUrl: m.type === 'YOUTUBE' ? this.toEmbedUrl(m.url) : undefined,
          })),
        })));
        this.loading.set(false);
      },
      error: () => { this.error.set('Chronicle not found'); this.loading.set(false); },
    });
  }

  nextSlide(p: ProcessedPassage) {
    p.currentSlide = (p.currentSlide + 1) % p.media.length;
  }

  prevSlide(p: ProcessedPassage) {
    p.currentSlide = (p.currentSlide - 1 + p.media.length) % p.media.length;
  }

  goToSlide(p: ProcessedPassage, index: number) {
    p.currentSlide = index;
  }

  // ─── Touch / swipe (mobile) ──────────────────────────────────────────────────
  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  onTouchEnd(e: TouchEvent, p: ProcessedPassage) {
    if (p.media.length < 2) return;
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    // Only act on a deliberate mostly-horizontal swipe, so vertical scroll
    // through the page isn't hijacked.
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) this.nextSlide(p); else this.prevSlide(p);
  }

  private toEmbedUrl(url: string): SafeResourceUrl | undefined {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    const videoId = match?.[1] ?? '';
    // Only trust a strictly-shaped 11-char YouTube id — never interpolate raw
    // input into the embed URL we hand to bypassSecurityTrustResourceUrl.
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return undefined;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`,
    );
  }
}
