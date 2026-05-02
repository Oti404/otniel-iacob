import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const adminRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile-editor.component').then(m => m.ProfileEditorComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/projects/projects-list.component').then(m => m.ProjectsListComponent),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./pages/projects/project-form.component').then(m => m.ProjectFormComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./pages/projects/project-form.component').then(m => m.ProjectFormComponent),
      },
      {
        path: 'experience',
        loadComponent: () =>
          import('./pages/experience/experience-list.component').then(m => m.ExperienceListComponent),
      },
      {
        path: 'experience/new',
        loadComponent: () =>
          import('./pages/experience/experience-form.component').then(m => m.ExperienceFormComponent),
      },
      {
        path: 'experience/:id',
        loadComponent: () =>
          import('./pages/experience/experience-form.component').then(m => m.ExperienceFormComponent),
      },
      {
        path: 'hobbies',
        loadComponent: () =>
          import('./pages/hobbies/hobbies-list.component').then((m) => m.HobbiesListComponent),
      },
      {
        path: 'hobbies/new',
        loadComponent: () =>
          import('./pages/hobbies/hobby-form.component').then((m) => m.HobbyFormComponent),
      },
      {
        path: 'hobbies/:id',
        loadComponent: () =>
          import('./pages/hobbies/hobby-form.component').then((m) => m.HobbyFormComponent),
      },
      {
        path: 'semesters',
        loadComponent: () =>
          import('./pages/semesters/semesters-list.component').then(m => m.SemestersListComponent),
      },
    ],
  },
];
