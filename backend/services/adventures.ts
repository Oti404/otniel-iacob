import { Chronicle, Passage, PassageMedia } from '@monorepo/database';
import { deleteFromCloudinary } from './cloudinary';

// ─── DTO mappers (Date → ISO string) ─────────────────────────────────────────

export function mapChronicle(c: Chronicle) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImage: c.coverImage,
    publishedAt: c.publishedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function mapPassage<P extends Passage>(p: P) {
  return {
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// A picked date is a pure calendar day. z.coerce.date() parses "2025-06-15"
// as UTC midnight, which displays as the previous day in any timezone behind
// UTC. Anchor it to NOON UTC so the calendar date is stable in any zone (±12h).
export function toNoonUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

// ─── Cloudinary cleanup (best effort) ────────────────────────────────────────
// A Cloudinary outage must not block deleting content from the site, so
// failures are logged and swallowed. Orphans can be cleaned from the dashboard.

export async function deleteMediaFiles(media: Pick<PassageMedia, 'cloudinaryId' | 'type'>[]): Promise<void> {
  const results = await Promise.allSettled(
    media
      .filter((m) => m.cloudinaryId)
      .map((m) => deleteFromCloudinary(m.cloudinaryId!, m.type === 'VIDEO' ? 'video' : 'image')),
  );
  for (const r of results) {
    if (r.status === 'rejected') console.error('[cloudinary] media delete failed', r.reason);
  }
}

/**
 * Covers are stored as a URL only. Recover the public id from
 * https://res.cloudinary.com/<cloud>/image/upload/[v123/]<public_id>.<ext>
 * Returns null for URLs that are not on our Cloudinary account.
 */
export function coverPublicId(url: string | null): string | null {
  if (!url) return null;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const match = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url);
  if (!match || match[1] !== cloud) return null;
  return match[2] ?? null;
}

export async function deleteCover(url: string | null): Promise<void> {
  const publicId = coverPublicId(url);
  if (!publicId) return;
  try {
    await deleteFromCloudinary(publicId, 'image');
  } catch (err) {
    console.error('[cloudinary] cover delete failed', err);
  }
}
