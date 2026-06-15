import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subscription, SubscriptionType, ApiResponse } from '@monorepo/shared';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private http = inject(HttpClient);

  getMine() {
    return this.http
      .get<{ data: Subscription[] }>('/api/subscriptions/mine', { withCredentials: true })
      .pipe(map(r => r.data));
  }

  subscribe(type: SubscriptionType, chronicleId?: number) {
    return this.http
      .post<ApiResponse<Subscription>>('/api/subscriptions', { type, chronicleId }, { withCredentials: true })
      .pipe(map(r => r.data));
  }

  unsubscribe(id: number) {
    return this.http.delete<void>(`/api/subscriptions/${id}`, { withCredentials: true });
  }
}
