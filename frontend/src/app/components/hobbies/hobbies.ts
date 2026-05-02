import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data';

@Component({
  selector: 'app-hobbies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hobbies.html',
  styleUrl: './hobbies.scss'
})
export class Hobbies {
  private service = inject(DataService);

  // Accesăm array-ul de string-uri din serviciu
  public hobbiesList = this.service.data.hobbies;
}
