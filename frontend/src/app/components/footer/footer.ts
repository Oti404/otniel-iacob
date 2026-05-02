import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Profile } from '@monorepo/shared';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer implements OnInit {
  profile: Profile | null = null;
  currentYear = new Date().getFullYear();

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getProfile().subscribe({
      next: (p) => { this.profile = p; },
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
