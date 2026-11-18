import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Chronicle } from '@monorepo/shared';
import { ChroniclesService } from '../../../core/services/chronicles.service';
import { CloudinaryImagePipe } from '../../../shared/pipes/cloudinary-image.pipe';
import { SubscribePanelComponent } from '../components/subscribe-panel.component';
import { MediaCarouselComponent } from '../components/media-carousel.component';
import { AdventuresTopbarComponent } from '../components/adventures-topbar.component';

@Component({
  selector: 'app-chronicle-page',
  standalone: true,
  imports: [DatePipe, CloudinaryImagePipe, SubscribePanelComponent, MediaCarouselComponent, AdventuresTopbarComponent],
  templateUrl: './chronicle-page.component.html',
  styleUrl: './chronicle-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChroniclePageComponent implements OnInit {
  private service = inject(ChroniclesService);
  private route = inject(ActivatedRoute);

  readonly chronicle = signal<Chronicle | null>(null);
  readonly passages = computed(() => this.chronicle()?.passages ?? []);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getChronicle(id).subscribe({
      next: (data) => { this.chronicle.set(data); this.loading.set(false); },
      error: () => { this.error.set('Chronicle not found.'); this.loading.set(false); },
    });
  }

  /** "01", "02", … */
  num(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
