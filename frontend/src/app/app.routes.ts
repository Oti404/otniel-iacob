// ...existing code...
import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Projects } from './components/projects/projects';
import { Hobbies } from './components/hobbies/hobbies';
import { AcademicJourneyComponent } from './components/academic-journey/academic-journey';
import { ExperienceComponent } from './components/experience/experience';
import { About } from './components/about/about';
import { Footer } from './components/footer/footer';
// ...existing code...
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'projects', component: Projects },
  { path: 'hobbies', component: Hobbies },
  { path: 'about-me', component: About },
  { path: 'academic-journey', component: AcademicJourneyComponent },
  { path: 'experience', component: ExperienceComponent },
  { path: 'academic-journey', component: AcademicJourneyComponent },
  { path: 'footer', component: Footer },
  { path: '**', redirectTo: '/home' }
];
