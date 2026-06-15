import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriberAuthService } from '../../services/subscriber-auth.service';
import { SubscriptionsService } from '../../services/subscriptions.service';
import { PushService } from '../../services/push.service';
import { Subscription } from '@monorepo/shared';

@Component({
  selector: 'app-subscribe-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sp">
      <div class="sp-label">NOTIFICATIONS</div>

      <ng-container *ngIf="auth.checked()">
        <ng-container *ngIf="!auth.subscriber()">
          <p class="sp-hint">Subscribe to get notified when new content is published.</p>
          <button class="sp-login-btn" (click)="auth.loginWithGoogle()">
            <span class="g-icon">G</span> Login with Google
          </button>
        </ng-container>

        <ng-container *ngIf="auth.subscriber()">
          <p class="sp-hint">Choose what to get notified about.</p>
          <p class="sp-loading" *ngIf="loading()">Loading...</p>
          <div class="sp-toggles" *ngIf="!loading()">
            <button
              class="sp-toggle"
              [class.sp-toggle--on]="!!globalSub"
              (click)="toggleGlobal()"
            >
              <span class="sp-dot">{{ globalSub ? '●' : '○' }}</span>
              All chronicles
            </button>
            <button
              class="sp-toggle"
              [class.sp-toggle--on]="!!chronicleSub"
              (click)="toggleChronicle()"
            >
              <span class="sp-dot">{{ chronicleSub ? '●' : '○' }}</span>
              This chronicle
            </button>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [`
    .sp {
      border: 1px solid var(--border-dim);
      border-radius: 8px;
      padding: 24px;
      margin-top: 60px;
    }
    .sp-label {
      font-size: 0.7rem;
      letter-spacing: 3px;
      color: var(--neon-blue);
      text-transform: uppercase;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .sp-hint {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0 0 16px;
    }
    .sp-loading {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0;
    }
    .sp-login-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 1px solid var(--border-dim);
      color: #ccc;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }
    .sp-login-btn:hover {
      border-color: var(--neon-blue);
      color: #fff;
    }
    .g-icon {
      font-weight: 900;
      color: var(--neon-blue);
    }
    .sp-toggles {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sp-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      background: transparent;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
      text-align: left;
      font-family: inherit;
    }
    .sp-toggle:hover {
      border-color: var(--neon-blue);
      color: #ccc;
    }
    .sp-toggle.sp-toggle--on {
      border-color: var(--neon-blue);
      color: var(--neon-blue);
    }
    .sp-dot {
      font-size: 0.9rem;
      flex-shrink: 0;
    }
  `],
})
export class SubscribePanelComponent implements OnInit {
  @Input({ required: true }) chronicleId!: number;

  readonly auth = inject(SubscriberAuthService);
  private subsService = inject(SubscriptionsService);
  private pushService = inject(PushService);

  readonly subscriptions = signal<Subscription[]>([]);
  readonly loading = signal(false);

  get globalSub() {
    return this.subscriptions().find(s => s.type === 'GLOBAL');
  }

  get chronicleSub() {
    return this.subscriptions().find(s => s.type === 'CHRONICLE' && s.chronicleId === this.chronicleId);
  }

  ngOnInit() {
    if (!this.auth.checked()) {
      this.auth.loadMe().subscribe(() => {
        if (this.auth.subscriber()) this.loadSubscriptions();
      });
    } else if (this.auth.subscriber()) {
      this.loadSubscriptions();
    }
  }

  private loadSubscriptions() {
    this.loading.set(true);
    this.subsService.getMine().subscribe({
      next: (subs) => { this.subscriptions.set(subs); this.loading.set(false); },
      error: () => { this.subscriptions.set([]); this.loading.set(false); },
    });
  }

  toggleGlobal() {
    const existing = this.globalSub;
    if (existing) {
      this.subsService.unsubscribe(existing.id).subscribe(() => {
        this.subscriptions.update(s => s.filter(x => x.id !== existing.id));
      });
    } else {
      this.subsService.subscribe('GLOBAL').subscribe(sub => {
        this.subscriptions.update(s => [...s, sub]);
        this.pushService.enable();
      });
    }
  }

  toggleChronicle() {
    const existing = this.chronicleSub;
    if (existing) {
      this.subsService.unsubscribe(existing.id).subscribe(() => {
        this.subscriptions.update(s => s.filter(x => x.id !== existing.id));
      });
    } else {
      this.subsService.subscribe('CHRONICLE', this.chronicleId).subscribe(sub => {
        this.subscriptions.update(s => [...s, sub]);
        this.pushService.enable();
      });
    }
  }
}
