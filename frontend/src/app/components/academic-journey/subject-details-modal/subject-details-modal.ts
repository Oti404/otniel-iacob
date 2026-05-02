import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from '@monorepo/shared';

@Component({
  selector: 'app-subject-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subject-details-modal.html',
  styleUrls: ['./subject-details-modal.scss'],
})
export class SubjectDetailsModalComponent {
  @Input({ required: true }) subject!: Subject;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
