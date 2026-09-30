import { Injectable, signal } from '@angular/core';
import { AppEvent } from '../../shared/models/event.model';

export interface KafkaRecordMetadata {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  schemaVersion: string;
}

export interface KafkaProducedMessage {
  id: string;
  topic: string;
  key: string;
  value: AppEvent;
  metadata: KafkaRecordMetadata;
}

@Injectable({
  providedIn: 'root'
})
export class MockKafkaProducer {
  private offsetCounter = 1000;

  readonly publishedMessages = signal<KafkaProducedMessage[]>([]);
  readonly totalMessagesCount = signal<number>(0);

  publish<T>(topic: string, key: string, event: AppEvent<T>, schemaVersion = 'v1.0'): Promise<KafkaRecordMetadata> {
    return new Promise(resolve => {
      this.offsetCounter++;
      const metadata: KafkaRecordMetadata = {
        topic,
        partition: 0,
        offset: this.offsetCounter,
        timestamp: Date.now(),
        schemaVersion
      };

      const record: KafkaProducedMessage = {
        id: event.id,
        topic,
        key,
        value: event as AppEvent,
        metadata
      };

      this.publishedMessages.update(history => [record, ...history.slice(0, 49)]);
      this.totalMessagesCount.update(c => c + 1);

      console.log(
        `%c[KAFKA PRODUCER]%c Topic: %c${topic}%c | Partition: 0 | Offset: ${metadata.offset} | Schema: ${schemaVersion}`,
        'color: #06b6d4; font-weight: bold;',
        'color: inherit;',
        'color: #6366f1; font-weight: bold;',
        'color: inherit;',
        event
      );

      resolve(metadata);
    });
  }
}

