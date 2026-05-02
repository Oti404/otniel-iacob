import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Home } from '../home/home';
import { Projects } from '../projects/projects';
import { ExperienceComponent } from '../experience/experience';
import { About } from '../about/about';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Navbar, Home, Projects, ExperienceComponent, About, Footer],
  templateUrl: './portfolio.component.html'
})
export class PortfolioComponent {}
