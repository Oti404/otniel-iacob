import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent {
  @Input() label = 'File';
  @Input() accept = 'image/*';
  @Input() currentUrl: string | null = null;
  @Output() uploaded = new EventEmitter<string>();

  uploading = false;
  error = '';

  constructor(private uploadService: UploadService) {}

  isImage(): boolean {
    if (!this.currentUrl) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(this.currentUrl);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.error = '';

    this.uploadService.upload(file).subscribe({
      next: (url) => {
        this.currentUrl = url;
        this.uploaded.emit(url);
        this.uploading = false;
      },
      error: () => {
        this.error = 'Upload failed.';
        this.uploading = false;
      },
    });
  }
}
