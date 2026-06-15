import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushService {
  private http = inject(HttpClient);

  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async enable(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const resp = await firstValueFrom(
        this.http.get<{ data: string }>('/api/push/vapid-public-key'),
      );

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return false;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToArrayBuffer(resp.data),
      });

      const json = sub.toJSON();
      await firstValueFrom(
        this.http.post('/api/push/subscribe', {
          endpoint: sub.endpoint,
          p256dh: json['keys']?.['p256dh'],
          auth: json['keys']?.['auth'],
        }, { withCredentials: true }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async disable(): Promise<void> {
    if (!this.isSupported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await firstValueFrom(
        this.http.request('DELETE', '/api/push/unsubscribe', {
          body: { endpoint },
          withCredentials: true,
        }),
      );
    } catch {}
  }

  private urlB64ToArrayBuffer(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
      view[i] = rawData.charCodeAt(i);
    }
    return buffer;
  }
}
