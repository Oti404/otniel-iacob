import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChroniclesService, ChronicleListItem } from '../../../core/services/chronicles.service';
import { SubscriberAuthService } from '../../../core/services/subscriber-auth.service';
import { CloudinaryImagePipe } from '../../../shared/pipes/cloudinary-image.pipe';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AdventuresTopbarComponent } from '../components/adventures-topbar.component';

@Component({
  selector: 'app-adventures-page',
  standalone: true,
  imports: [DatePipe, RouterLink, CloudinaryImagePipe, IconComponent, AdventuresTopbarComponent],
  templateUrl: './adventures-page.component.html',
  styleUrl: './adventures-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdventuresPageComponent implements OnInit {
  private service = inject(ChroniclesService);
  private auth = inject(SubscriberAuthService);
  private route = inject(ActivatedRoute);

  readonly chronicles = signal<ChronicleListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly authError = signal(false);

  ngOnInit(): void {
    this.authError.set(this.route.snapshot.queryParamMap.get('auth') === 'error');
    this.auth.loadMe().subscribe();
    this.service.getChronicles().subscribe({
      next: (data) => { this.chronicles.set(data); this.loading.set(false); },
      error: () => { this.error.set('Could not load chronicles.'); this.loading.set(false); },
    });
  }
}
