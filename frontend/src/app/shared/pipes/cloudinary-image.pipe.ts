import { Pipe, PipeTransform } from '@angular/core';

/**
 * Rewrites a Cloudinary image URL to request an optimized delivery:
 *   - f_auto   → best format the browser supports (AVIF/WebP/…)
 *   - q_auto   → automatic quality (visually lossless, much smaller)
 *   - dpr_auto → correct resolution for the device pixel ratio
 *   - w_<n>,c_limit → cap the width so we don't ship a 4000px original
 *
 * Non-Cloudinary URLs (external links, /uploads/…) are returned untouched.
 * Pure pipe: memoized, only recomputes when the url/width inputs change.
 */
@Pipe({ name: 'cldImg', standalone: true, pure: true })
export class CloudinaryImagePipe implements PipeTransform {
  transform(url: string | null | undefined, width?: number): string {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
    const params = ['f_auto', 'q_auto', 'dpr_auto'];
    if (width) params.push(`w_${width}`, 'c_limit');
    return url.replace('/image/upload/', `/image/upload/${params.join(',')}/`);
  }
}
