import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubscriberAuthService } from './core/services/subscriber-auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private subscriberAuth = inject(SubscriberAuthService);

  ngOnInit() {
    this.subscriberAuth.loadMe().subscribe();
  }
}
