import { Observable } from 'rxjs';
import { PageViewPayload } from '../../shared/models/event.model';

export interface IngestedKafkaRecord {
  status: 'INGESTED' | 'QUEUED';
  topic: string;
  partition: number;
  offset: number;
  key: string;
  eventId: string;
  timestamp: number;
}

export abstract class AnalyticsRepository {
  abstract trackPageView(payload: PageViewPayload): Observable<IngestedKafkaRecord>;
}
