import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { ApiResponse, GoogleSubscriber } from '@monorepo/shared';

@Injectable({ providedIn: 'root' })
export class SubscriberAuthService {
  private http = inject(HttpClient);

  readonly subscriber = signal<GoogleSubscriber | null>(null);
  readonly checked = signal(false);
  private meRequest$: Observable<unknown> | null = null;

  loadMe() {
    if (this.checked()) return of(null);
    if (this.meRequest$) return this.meRequest$;
    this.meRequest$ = this.http.get<ApiResponse<GoogleSubscriber>>('/api/auth/subscriber/me').pipe(
      tap((r) => { this.subscriber.set(r.data); this.checked.set(true); this.meRequest$ = null; }),
      catchError(() => { this.subscriber.set(null); this.checked.set(true); this.meRequest$ = null; return of(null); }),
      shareReplay(1),
    );
    return this.meRequest$;
  }

  logout() {
    return this.http.post('/api/auth/subscriber/logout', {}).pipe(
      tap(() => this.subscriber.set(null)),
    );
  }

  loginWithGoogle() {
    window.location.href = '/api/auth/google';
  }
}
