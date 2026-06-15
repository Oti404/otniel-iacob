import webpush from 'web-push';
import { prisma } from '@monorepo/database';

export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

if (isPushConfigured()) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function notifySubscribers(scope: 'global' | 'chronicle', chronicleId?: number): Promise<void> {
  if (!isPushConfigured()) return;

  const include = { subscriber: { include: { pushSubscriptions: true } } } as const;

  const subscriptions = scope === 'global'
    ? await prisma.subscription.findMany({ where: { type: 'GLOBAL' }, include })
    : await prisma.subscription.findMany({ where: { type: 'CHRONICLE', chronicleId: chronicleId ?? null }, include });

  const pushSubs = subscriptions.flatMap(s => s.subscriber.pushSubscriptions);
  const unique = [...new Map(pushSubs.map(p => [p.endpoint, p])).values()];
  if (unique.length === 0) return;

  let title = 'New adventure';
  let body = '';
  let url = '/adventures';

  if (chronicleId) {
    const chronicle = await prisma.chronicle.findUnique({ where: { id: chronicleId } });
    if (chronicle) {
      title = scope === 'global' ? 'New chronicle published' : `New passage in ${chronicle.title}`;
      body = chronicle.title;
      url = `/adventures/${chronicleId}`;
    }
  }

  const payload = JSON.stringify({ title, body, url });

  await Promise.allSettled(
    unique.map(async (ps) => {
      try {
        await webpush.sendNotification(
          { endpoint: ps.endpoint, keys: { p256dh: ps.p256dh, auth: ps.auth } },
          payload,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { id: ps.id } }).catch(() => {});
        }
      }
    }),
  );
}
