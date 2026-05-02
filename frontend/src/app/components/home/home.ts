import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
@Component({
  selector: 'app-home',
  standalone: true,
  // --- ADAUGĂ-LE ÎN LISTA DE IMPORTS ---
  imports: [
    CommonModule,
    NgOptimizedImage  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
}
