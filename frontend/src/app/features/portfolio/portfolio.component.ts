import { Component } from '@angular/core';
import { Navbar } from './sections/navbar/navbar';
import { Home } from './sections/home/home';
import { Projects } from './sections/projects/projects';
import { ExperienceComponent } from './sections/experience/experience';
import { About } from './sections/about/about';
import { Footer } from './sections/footer/footer';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Navbar, Home, Projects, ExperienceComponent, About, Footer],
  templateUrl: './portfolio.component.html',
  styles: [`
    .skip-link {
      position: fixed; top: var(--s-2); left: var(--s-2); z-index: 200;
      padding: var(--s-2) var(--s-4); background: var(--accent); color: var(--text-on-accent);
      border-radius: var(--radius-sm); translate: 0 -200%;
    }
    .skip-link:focus { translate: 0 0; }
    main:focus { outline: none; }
  `],
})
export class PortfolioComponent {
  // Hash routing would treat href="#main" as a route, so move focus manually.
  skipToMain(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main');
    main?.focus();
    main?.scrollIntoView();
  }
}
