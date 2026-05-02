import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Profile } from '@monorepo/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  profile: Profile | null = null;

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getProfile().subscribe({
      next: (p) => { this.profile = p; },
    });
  }
}
