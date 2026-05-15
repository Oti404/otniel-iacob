import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.getToken()) return true;

  // Token absent (e.g. page refresh) — attempt silent refresh using the httpOnly cookie.
  // Only redirect to login if the refresh call itself fails.
  return auth.refresh().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/admin/login'])))
  );
};
