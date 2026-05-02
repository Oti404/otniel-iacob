import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data'; // Asigură-te că calea e corectă

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class Footer {
  profile: any; // Aici vom stoca datele profilului
  currentYear = new Date().getFullYear();

  // 1. Injectăm serviciul în constructor
  constructor(private dataService: DataService) {
    // 2. Extragem datele din instanța serviciului
    this.profile = this.dataService.data.profile;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
