import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- IMPORT DIRECT ---
// Ajustează calea ('../../service/projects') dacă fișierul tău e în alt loc
import { academicData } from '../../services/projects';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects implements OnInit {

  // Variabila care va ține lista finală sortată
  public sortedProjects: any[] = [];

  ngOnInit() {
    this.processProjects();
  }

 private processProjects() {
    const rawProjects = academicData.projects;

    this.sortedProjects = [...rawProjects]
      .filter(p => p.display === true) // <--- FILTRARE NOUĂ: Doar cele cu display true
      .sort((a, b) => {
          // ... logica ta de sortare existentă ...
          if (a.status === 'wip' && b.status !== 'wip') return -1;
          if (a.status !== 'wip' && b.status === 'wip') return 1;

          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
      });
  }
  // Add this method to your Projects class
isContributorLink(c: string | [string, string]): c is [string, string] {
  return Array.isArray(c);
}
}
