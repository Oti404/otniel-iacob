import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  constructor(private auth: AuthService) {}

  get email(): string {
    return this.auth.getUserEmail() ?? 'admin';
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
