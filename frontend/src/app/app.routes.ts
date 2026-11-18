import { Routes } from '@angular/router';
import { PortfolioComponent } from './features/portfolio/portfolio.component';

export const routes: Routes = [
  { path: '', component: PortfolioComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: 'adventures',
    loadChildren: () => import('./features/adventures/adventures.routes').then((m) => m.adventuresRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];
