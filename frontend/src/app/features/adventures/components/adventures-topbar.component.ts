import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubscriberAuthService } from '../../../core/services/subscriber-auth.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { GoogleButtonComponent } from './google-button.component';

/** Back link + subscriber sign-in state. Shared by the adventures list and chronicle pages. */
@Component({
  selector: 'app-adventures-topbar',
  standalone: true,
  imports: [RouterLink, IconComponent, GoogleButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar container">
      <a class="back" [routerLink]="backLink()">
        <app-icon name="arrow-left" [size]="16" /> {{ backLabel() }}
      </a>

      <div class="auth">
        @if (auth.checked()) {
          @if (auth.subscriber(); as sub) {
            @if (sub.picture) {
              <img class="avatar" [src]="sub.picture" alt="" width="28" height="28" referrerpolicy="no-referrer" />
            }
            <span class="name">{{ sub.name }}</span>
            <button type="button" class="logout" (click)="logout()" aria-label="Sign out">
              <app-icon name="logout" [size]="16" />
            </button>
          } @else {
            <app-google-button [compact]="true" />
          }
        }
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
      gap: var(--s-3); min-height: var(--nav-h);
      border-bottom: 1px solid var(--border);
    }
    .back {
      display: inline-flex; align-items: center; gap: var(--s-2);
      min-height: 44px;
      font-size: var(--fs-sm); letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--accent);
    }
    .back:hover { text-decoration: underline; }
    .auth { display: flex; align-items: center; gap: var(--s-2); min-width: 0; }
    .avatar { border-radius: 50%; border: 1px solid var(--border-strong); }
    .name { font-size: var(--fs-sm); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 18ch; }
    .logout {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: none; border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
      color: var(--text-muted); cursor: pointer;
    }
    .logout:hover { color: var(--danger); border-color: var(--danger); }
  `],
})
export class AdventuresTopbarComponent {
  readonly auth = inject(SubscriberAuthService);
  readonly backLink = input('/');
  readonly backLabel = input('Portfolio');

  logout(): void {
    this.auth.logout().subscribe();
  }
}
