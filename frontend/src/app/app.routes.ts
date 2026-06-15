import { Routes } from '@angular/router';
import { PortfolioComponent } from './components/portfolio/portfolio.component';

export const routes: Routes = [
  { path: '', component: PortfolioComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: 'adventures',
    loadChildren: () => import('./adventures/adventures.routes').then((m) => m.adventuresRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];
