import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { HealthStatus } from '@monorepo/shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
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
