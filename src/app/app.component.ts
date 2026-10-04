import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrackingService } from './core/services/tracking.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Injectarea obligatorie pentru ca Angular sa instantiereze TrackingService pe loc la startup!
  private trackingService = inject(TrackingService);
  title = 'commerce-spa';
}
