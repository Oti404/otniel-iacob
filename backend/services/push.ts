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

/**
 * scope 'global'    → a chronicle was published: notify GLOBAL subscribers.
 * scope 'chronicle' → a passage was published: notify that chronicle's followers
 *                     and GLOBAL subscribers ("all chronicles").
 * URLs use the hash form because the SPA uses hash routing.
 */
export async function notifySubscribers(scope: 'global' | 'chronicle', chronicleId: number): Promise<void> {
  if (!isPushConfigured()) return;

  const chronicle = await prisma.chronicle.findUnique({ where: { id: chronicleId } });
  if (!chronicle) return;

  const subscriptions = await prisma.subscription.findMany({
    where: scope === 'global'
      ? { type: 'GLOBAL' }
      : { OR: [{ type: 'GLOBAL' }, { type: 'CHRONICLE', chronicleId }] },
    include: { subscriber: { include: { pushSubscriptions: true } } },
  });

  const pushSubs = subscriptions.flatMap(s => s.subscriber.pushSubscriptions);
  const unique = [...new Map(pushSubs.map(p => [p.endpoint, p])).values()];
  if (unique.length === 0) return;

  const title = scope === 'global' ? 'New chronicle published' : `New passage in ${chronicle.title}`;
  const body = scope === 'global' ? chronicle.title : 'A new passage is up. Tap to read.';
  const url = `/#/adventures/${chronicleId}`;

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
