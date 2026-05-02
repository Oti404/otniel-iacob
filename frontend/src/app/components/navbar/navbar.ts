
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // --- Funcția care repară navigarea ---
  scrollToSection(sectionId: string) {
    this.isMenuOpen = false; // Închidem meniul pe mobil automat

    const element = document.getElementById(sectionId);
    if (element) {
      // Facem scroll fin până la element
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
