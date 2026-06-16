import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChroniclesService, ChronicleListItem } from '../../services/chronicles.service';
import { SubscriberAuthService } from '../../services/subscriber-auth.service';
import { CloudinaryImagePipe } from '../../shared/cloudinary-image.pipe';

@Component({
  selector: 'app-adventures-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryImagePipe],
  templateUrl: './adventures-page.component.html',
  styleUrl: './adventures-page.component.scss',
})
export class AdventuresPageComponent implements OnInit {
  private service = inject(ChroniclesService);
  readonly auth = inject(SubscriberAuthService);
  private route = inject(ActivatedRoute);

  readonly chronicles = signal<ChronicleListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  authError = false;

  ngOnInit() {
    this.authError = this.route.snapshot.queryParamMap.get('auth') === 'error';
    this.auth.loadMe().subscribe();
    this.service.getChronicles().subscribe({
      next: (data) => { this.chronicles.set(data); this.loading.set(false); },
      error: () => { this.error.set('Could not load chronicles'); this.loading.set(false); },
    });
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
