import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importăm datele din serviciu
import { experienceData, Experience } from '../../services/experience';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class ExperienceComponent {
  // Atribuim datele importate variabilei locale
  experiences: Experience[] = experienceData;
}
