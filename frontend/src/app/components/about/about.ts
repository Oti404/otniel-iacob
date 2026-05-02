import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Profile } from '@monorepo/shared';

interface DetailBlock {
  type: string;
  icon: string;
  label: string;
  value: string;
  displayValue: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  profile: Profile | null = null;
  details: DetailBlock[] = [];
  loading = true;

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getProfile().subscribe({
      next: (p) => {
        if (!p) return;
        this.profile = p;
        this.details = [
          { type: 'link', icon: 'linkedin', label: 'LinkedIn', value: p.linkedin, displayValue: ' otniel-iacob' },
          { type: 'link', icon: 'github', label: 'GitHub', value: p.github, displayValue: ' Oti404' },
          { type: 'info', icon: 'email', label: 'Email', value: `mailto:${p.email}`, displayValue: p.email },
          { type: 'info', icon: 'location', label: 'Location', value: '#', displayValue: p.location },
          { type: 'link', icon: 'cv', label: 'Resume / CV', value: p.cvPdf, displayValue: 'Download PDF' },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getIcon(iconName: string): string {
    const icons: Record<string, string> = {
      linkedin: '💼', github: '👾', email: '✉️', location: '📍', cv: '📄',
    };
    return icons[iconName] ?? '🔹';
  }
}
