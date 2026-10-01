import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrackingService } from './core/services/tracking.service';
import { KafkaConsumerService } from './core/event-bus/kafka-consumer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'commerce-spa';

  // Bootstraps end-to-end tracking: Angular localhost -> TrackingService -> Backend API -> Kafka -> Consumer -> DB
  private trackingService = inject(TrackingService);
  private kafkaConsumer = inject(KafkaConsumerService);
}
