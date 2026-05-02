import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from '../../../../data/academicData'; // Ajustează calea dacă e nevoie

@Component({
  selector: 'app-subject-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-details-modal.html',
  styleUrls: ['./subject-details-modal.scss']
})
export class SubjectDetailsModalComponent {
  // Primim materia de la părinte
  @Input({ required: true }) subject!: Subject;

  // Trimitem semnal la părinte să închidă modalul
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Dacă dăm click pe fundalul negru (nu pe card), închidem
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
