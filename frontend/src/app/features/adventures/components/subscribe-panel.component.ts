import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Subscription } from '@monorepo/shared';
import { SubscriberAuthService } from '../../../core/services/subscriber-auth.service';
import { SubscriptionsService } from '../../../core/services/subscriptions.service';
import { PushResult, PushService } from '../../../core/services/push.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { GoogleButtonComponent } from './google-button.component';

const PUSH_MESSAGES: Record<Exclude<PushResult, 'enabled'>, string> = {
  denied: 'Notifications are blocked for this site. Allow them in your browser settings to get alerts.',
  unsupported: 'This browser can’t receive push notifications. On iPhone, add the site to your home screen first.',
  error: 'Saved, but push notifications could not be set up on this device. Try again later.',
};

@Component({
  selector: 'app-subscribe-panel',
  standalone: true,
  imports: [IconComponent, GoogleButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sp" aria-labelledby="sp-title">
      <h2 id="sp-title" class="sp-title"><app-icon name="bell" [size]="16" /> Get notified</h2>

      @if (auth.checked()) {
        @if (!auth.subscriber()) {
          <p class="sp-text">
            Get a browser notification when a new chronicle or passage goes up.
            Sign-in is only used to remember your choice. No emails, no newsletter.
          </p>
          <app-google-button />
        } @else if (loading()) {
          <p class="sp-text">Loading your preferences…</p>
        } @else {
          <p class="sp-text">Choose what to hear about. Turn either off at any time.</p>
          <div class="sp-toggles">
            <button type="button" class="sp-toggle" [attr.aria-pressed]="!!globalSub()" [disabled]="busy()" (click)="toggleGlobal()">
              <span class="sp-switch" aria-hidden="true"></span>
              <span><strong>All chronicles</strong><small>New chronicles and every new passage</small></span>
            </button>
            <button type="button" class="sp-toggle" [attr.aria-pressed]="!!chronicleSub()" [disabled]="busy()" (click)="toggleChronicle()">
              <span class="sp-switch" aria-hidden="true"></span>
              <span><strong>This chronicle</strong><small>New passages here only</small></span>
            </button>
          </div>
        }
      }

      @if (notice(); as n) {
        <p class="sp-notice" role="status"><app-icon name="bell-off" [size]="14" /> {{ n }}</p>
      }
    </section>
  `,
  styles: [`
    .sp {
      margin-top: var(--s-8);
      padding: var(--s-5);
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 2px solid var(--accent-2);
      border-radius: var(--radius-md);
    }
    .sp-title {
      display: flex; align-items: center; gap: var(--s-2);
      margin-bottom: var(--s-3);
      font-size: var(--fs-sm); letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--accent-2);
    }
    .sp-text { margin-bottom: var(--s-4); font-size: var(--fs-sm); color: var(--text-muted); max-width: 60ch; }
    .sp-toggles { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--s-2); }
    .sp-toggle {
      display: flex; align-items: center; gap: var(--s-3);
      padding: var(--s-3) var(--s-4);
      background: transparent; text-align: left; cursor: pointer;
      border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: border-color var(--dur) var(--ease), color var(--dur) var(--ease);
    }
    .sp-toggle:hover:not(:disabled) { border-color: var(--accent); }
    .sp-toggle:disabled { opacity: 0.6; cursor: progress; }
    .sp-toggle strong { display: block; font-size: var(--fs-sm); font-weight: 600; color: var(--text); }
    .sp-toggle small { font-size: var(--fs-xs); }
    .sp-toggle[aria-pressed='true'] { border-color: rgba(var(--accent-rgb), 0.6); background: var(--accent-soft); }
    .sp-switch {
      position: relative; flex-shrink: 0; width: 30px; height: 16px;
      border: 1px solid var(--border-strong); border-radius: 999px;
    }
    .sp-switch::after {
      content: ''; position: absolute; top: 2px; left: 2px; width: 10px; height: 10px;
      border-radius: 50%; background: var(--text-muted); transition: translate var(--dur) var(--ease);
    }
    [aria-pressed='true'] .sp-switch { border-color: var(--accent); }
    [aria-pressed='true'] .sp-switch::after { translate: 14px 0; background: var(--accent); box-shadow: var(--glow); }
    .sp-notice {
      display: flex; gap: var(--s-2); align-items: flex-start;
      margin-top: var(--s-4); font-size: var(--fs-xs); color: var(--warning);
    }
  `],
})
export class SubscribePanelComponent implements OnInit {
  readonly chronicleId = input.required<number>();

  readonly auth = inject(SubscriberAuthService);
  private subsService = inject(SubscriptionsService);
  private pushService = inject(PushService);

  readonly subscriptions = signal<Subscription[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly notice = signal<string | null>(null);

  readonly globalSub = computed(() => this.subscriptions().find((s) => s.type === 'GLOBAL'));
  readonly chronicleSub = computed(() =>
    this.subscriptions().find((s) => s.type === 'CHRONICLE' && s.chronicleId === this.chronicleId()),
  );

  ngOnInit(): void {
    if (!this.auth.checked()) {
      this.auth.loadMe().subscribe(() => {
        if (this.auth.subscriber()) this.loadSubscriptions();
      });
    } else if (this.auth.subscriber()) {
      this.loadSubscriptions();
    }
  }

  toggleGlobal(): void {
    this.toggle(this.globalSub(), 'GLOBAL');
  }

  toggleChronicle(): void {
    this.toggle(this.chronicleSub(), 'CHRONICLE');
  }

  private loadSubscriptions(): void {
    this.loading.set(true);
    this.subsService.getMine().subscribe({
      next: (subs) => { this.subscriptions.set(subs); this.loading.set(false); },
      error: () => { this.subscriptions.set([]); this.loading.set(false); },
    });
  }

  private toggle(existing: Subscription | undefined, type: 'GLOBAL' | 'CHRONICLE'): void {
    this.busy.set(true);
    if (existing) {
      this.subsService.unsubscribe(existing.id).subscribe({
        next: () => this.subscriptions.update((s) => s.filter((x) => x.id !== existing.id)),
        complete: () => this.busy.set(false),
        error: () => this.busy.set(false),
      });
      return;
    }
    const chronicleId = type === 'CHRONICLE' ? this.chronicleId() : undefined;
    this.subsService.subscribe(type, chronicleId).subscribe({
      next: async (sub) => {
        this.subscriptions.update((s) => [...s, sub]);
        const result = await this.pushService.enable();
        this.notice.set(result === 'enabled' ? null : PUSH_MESSAGES[result]);
        this.busy.set(false);
      },
      error: () => this.busy.set(false),
    });
  }
}
