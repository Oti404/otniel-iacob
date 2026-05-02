import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { Hobby } from '@monorepo/shared';

@Component({
  selector: 'app-hobbies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hobbies.html',
  styleUrl: './hobbies.scss',
})
export class Hobbies implements OnInit {
  hobbiesList: Hobby[] = [];
  loading = true;

  constructor(private content: ContentService) {}

  ngOnInit() {
    this.content.getHobbies().subscribe({
      next: (data) => { this.hobbiesList = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
