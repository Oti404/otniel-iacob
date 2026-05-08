import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Semester, Subject } from '@monorepo/shared';
import { SubjectDetailsModalComponent } from './subject-details-modal/subject-details-modal';

@Component({
  selector: 'app-academic-journey',
  standalone: true,
  imports: [CommonModule, SubjectDetailsModalComponent],
  templateUrl: './academic-journey.html',
  styleUrls: ['./academic-journey.scss'],
})
export class AcademicJourneyComponent implements OnInit {
  academicData: Semester[] = [];
  activeSemester: Semester | null = null;
  selectedSubject: Subject | null = null;
  loading = true;

  @ViewChild('academicContainer') containerRef!: ElementRef;
  private content = inject(ContentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.content.getSemesters().subscribe({
      next: (semesters) => {
        this.academicData = semesters;
        this.activeSemester = semesters[0] ?? null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  selectSemester(sem: Semester): void {
    this.activeSemester = sem;
    if (this.containerRef) {
      const element = this.containerRef.nativeElement;
      const headerOffset = 80;
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
