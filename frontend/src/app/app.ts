import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HealthStatus } from '@monorepo/shared';
import { Navbar } from './components/navbar/navbar';
import { Home } from './components/home/home';
import { Projects } from './components/projects/projects';
import { Hobbies } from './components/hobbies/hobbies';
import { ExperienceComponent } from './components/experience/experience';
import { NgOptimizedImage } from '@angular/common';
import { About } from './components/about/about';
import { AcademicJourneyComponent } from './components/academic-journey/academic-journey';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Navbar, Home, Projects,ExperienceComponent, Footer , About],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isMenuOpen = false;
  backendStatus: HealthStatus | null = null;
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get<HealthStatus>('/api/health').subscribe({
      next: (data) => {
        this.backendStatus = data;
        console.log('Backend connection successful:', data);
      },
      error: (err) => {
        console.error('Failed to connect to backend', err);
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
