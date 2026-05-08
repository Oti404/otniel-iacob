import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ContentService } from '../../../services/content.service';
import { AdminDataService } from '../../services/admin-data.service';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';

const urlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string;
  if (!value) return { required: true };
  try { new URL(value); return null; } catch { return { url: true }; }
};

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './profile-editor.component.html',
  styleUrls: ['./profile-editor.component.scss']
})
export class ProfileEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contentService = inject(ContentService);
  private adminDataService = inject(AdminDataService);
  private cdr = inject(ChangeDetectorRef);

  profileForm!: FormGroup;
  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      description: ['', Validators.required],
      headline: [''],
      quote: [''],
      quoteAuthor: [''],
      location: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      linkedin: ['', urlValidator],
      github: ['', urlValidator],
      photo: ['', Validators.required],
      avatar: ['', Validators.required],
      cvPdf: ['', Validators.required]
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.contentService.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.profileForm.patchValue(profile);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load profile data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPhotoUploaded(url: string): void {
    this.profileForm.patchValue({ photo: url });
  }

  onAvatarUploaded(url: string): void {
    this.profileForm.patchValue({ avatar: url });
  }

  onCvUploaded(url: string): void {
    this.profileForm.patchValue({ cvPdf: url });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fix form errors before saving.';
      return;
    }

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.adminDataService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.saving = false;
        this.profileForm.patchValue(profile);
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update profile.';
        this.saving = false;
      }
    });
  }
}
