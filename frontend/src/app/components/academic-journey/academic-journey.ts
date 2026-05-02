import { ACADEMIC_DATA, Semester, Subject } from '../../../data/academicData';
// IMPORTĂM NOUA COMPONENTĂ
import { SubjectDetailsModalComponent } from './subject-details-modal/subject-details-modal';

import { Component, ElementRef, ViewChild } from '@angular/core'; // <--- Importă ViewChild și ElementRef
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-academic-journey',
  standalone: true,
  imports: [CommonModule, SubjectDetailsModalComponent],
  templateUrl: './academic-journey.html',
  styleUrls: ['./academic-journey.scss']
})
export class AcademicJourneyComponent {
  academicData: Semester[] = ACADEMIC_DATA;
  activeSemester: Semester = this.academicData[0];
  selectedSubject: Subject | null = null;

  // 1. Accesăm elementul din HTML
  @ViewChild('academicContainer') containerRef!: ElementRef;

  selectSemester(sem: Semester): void {
    this.activeSemester = sem;

    // 2. Logica nouă de scroll
    if (this.containerRef) {
      const element = this.containerRef.nativeElement;
      const headerOffset = 80; // Ajustează asta (60-100) în funcție de cât de înalt e meniul tău de sus
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  openModal(subject: Subject): void {
    this.selectedSubject = subject;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedSubject = null;
    document.body.style.overflow = 'auto';
  }
}
