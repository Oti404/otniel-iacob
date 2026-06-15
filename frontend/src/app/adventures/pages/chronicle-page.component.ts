import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChroniclesService } from '../../services/chronicles.service';
import { Chronicle, Passage, PassageMedia } from '@monorepo/shared';
import { SubscribePanelComponent } from '../components/subscribe-panel.component';

type ProcessedMedia = PassageMedia & { embedUrl?: SafeResourceUrl };
type ProcessedPassage = Omit<Passage, 'media'> & { media: ProcessedMedia[] };

@Component({
  selector: 'app-chronicle-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SubscribePanelComponent],
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

  private toEmbedUrl(url: string): SafeResourceUrl {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    const videoId = match?.[1] ?? '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`,
    );
  }
}
