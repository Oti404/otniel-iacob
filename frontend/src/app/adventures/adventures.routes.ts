import { Routes } from '@angular/router';

export const adventuresRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/adventures-page.component').then((m) => m.AdventuresPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/chronicle-page.component').then((m) => m.ChroniclePageComponent),
  },
];
