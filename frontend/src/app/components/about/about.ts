import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data'; // Asigură-te că calea e corectă

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  // 1. Injectăm Serviciul
  private dataService = inject(DataService);

  // 2. Extragem profilul pentru a-l folosi ușor în HTML (pentru poză și descriere)
  public profile = this.dataService.data.profile;

  // 3. Construim lista de "Data Blocks" folosind datele din serviciu
  public details = [
    {
      type: 'link',
      icon: 'linkedin',
      label: 'LinkedIn',
      value: this.profile.linkedin,
      displayValue: ' otniel-iacob' // Putem formata textul manual sau îl lăsăm fix
    },
    {
      type: 'link',
      icon: 'github',
      label: 'GitHub',
      value: this.profile.github,
      displayValue: ' Oti404'
    },
    {
      type: 'info',
      icon: 'email',
      label: 'Email',
      value: `mailto:${this.profile.email}`, // "mailto:" face link-ul să deschidă aplicația de mail
      displayValue: this.profile.email
    },
    {
      type: 'info',
      icon: 'location',
      label: 'Location',
      value: '#',
      displayValue: this.profile.location
    },
    // Putem adăuga și link-ul către CV dacă vrei un buton special
    {
      type: 'link',
      icon: 'cv',
      label: 'Resume / CV',
      value: this.profile.cvPdf,
      displayValue: 'Download PDF'
    }
  ];

  // Helper pentru iconițe
  getIcon(iconName: string): string {
    const icons: any = {
      linkedin: '💼',
      github: '👾',
      email: '✉️',
      location: '📍',
      cv: '📄'
    };
    return icons[iconName] || '🔹';
  }
}
