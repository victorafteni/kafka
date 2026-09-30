import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryService } from '../../core/services/telemetry.service';
import { MockKafkaProducer } from '../../core/event-bus/mock-kafka.producer';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, AppBadgeComponent],
  template: `
    <div class="monitoring-page">
      <div class="container">
        <div class="dash-header">
          <div>
            <div class="badge-row">
              <app-badge variant="accent" [dot]="true">Real-Time Telemetry & Kafka Stream</app-badge>
            </div>
            <h1 class="page-title">Frontend Operations & Kafka Observability</h1>
            <p class="subtitle">
              Live operational awareness for event bus emissions, latency profiling, and distributed tracing.
            </p>
          </div>
          <div class="header-actions">
            <span class="pulse-indicator">
              <span class="live-dot"></span>
              Live Pipeline Connected
            </span>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon api">
              <span class="material-icons-outlined">http</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">API Requests</span>
              <span class="metric-value">{{ telemetry.apiRequests() | number }}</span>
              <span class="metric-trend text-success">↑ 100% telemetry coverage</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon search">
              <span class="material-icons-outlined">search</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Search Queries</span>
              <span class="metric-value">{{ telemetry.searchRequests() | number }}</span>
              <span class="metric-trend text-primary">Algolia Engine Fast Path</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon cart">
              <span class="material-icons-outlined">shopping_cart</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Cart & Order Events</span>
              <span class="metric-value">{{ telemetry.cartEvents() | number }}</span>
              <span class="metric-trend text-primary">Redis Simulation Sync</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon errors">
              <span class="material-icons-outlined">gpp_maybe</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Captured Errors</span>
              <span class="metric-value">{{ telemetry.errors() }}</span>
              <span class="metric-trend text-muted">0.02% error budget</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon latency">
              <span class="material-icons-outlined">speed</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Avg API Latency</span>
              <span class="metric-value">{{ telemetry.averageResponseTime() }} <span class="unit">ms</span></span>
              <span class="metric-trend text-success">Sub-200ms target met</span>
            </div>
          </div>
        </div>

        <div class="kafka-section">
          <div class="section-title-row">
            <div>
              <h2 class="section-title">
                <span class="material-icons-outlined">hub</span>
                Kafka Producer Event Log
              </h2>
              <p class="section-sub">
                Inspecting in-flight events published to Kafka topics mapped to Avro schema contracts.
              </p>
            </div>
            <div class="stream-stats">
              <span>Total Emitted: <strong>{{ kafkaProducer.totalMessagesCount() }}</strong></span>
            </div>
          </div>

          @if (kafkaMessages().length === 0) {
            <div class="empty-stream">
              <span class="material-icons-outlined">radio</span>
              <p>No events emitted yet in this session. Browse products, search, or add items to cart to see live Kafka streams!</p>
            </div>
          } @else {
            <div class="messages-table-wrapper">
              <table class="kafka-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Topic</th>
                    <th>Offset</th>
                    <th>Key</th>
                    <th>Event Type</th>
                    <th>Avro Schema</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (msg of kafkaMessages(); track msg.id) {
                    <tr>
                      <td class="font-mono text-muted">{{ msg.metadata.timestamp | date:'HH:mm:ss.SSS' }}</td>
                      <td>
                        <span class="topic-tag">{{ msg.topic }}</span>
                      </td>
                      <td class="font-mono">#{{ msg.metadata.offset }}</td>
                      <td class="font-mono">{{ msg.key }}</td>
                      <td>
                        <span class="event-badge">{{ msg.value.type }}</span>
                      </td>
                      <td>
                        <span class="schema-version">{{ msg.metadata.schemaVersion }}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="view-payload-btn"
                          (click)="togglePayload(msg.id)">
                          {{ selectedMessageId() === msg.id ? 'Hide Payload' : 'View Payload' }}
                        </button>
                      </td>
                    </tr>
                    @if (selectedMessageId() === msg.id) {
                      <tr class="payload-row">
                        <td colspan="7">
                          <div class="payload-box">
                            <span class="payload-header">Avro Record Payload (JSON Representation):</span>
                            <pre class="payload-json">{{ formatPayload(msg.value) }}</pre>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .monitoring-page {
      padding: 32px 0 60px;
    }

    .dash-header {
      @include flex-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid $gray-200;

      @media (max-width: $bp-md) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }

    .badge-row {
      margin-bottom: 8px;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: $gray-900;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.9375rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .pulse-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 6px 14px;
      border-radius: $radius-full;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: blink 1.2s infinite ease-in-out;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 20px;
      display: flex;
      gap: 16px;
      box-shadow: $shadow-xs;
      transition: transform $transition-fast;

      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-md;
      }
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: $radius-md;
      @include flex-center;

      .material-icons-outlined {
        font-size: 24px;
      }

      &.api { background: $primary-50; color: $primary-600; }
      &.search { background: #ecfeff; color: #0891b2; }
      &.cart { background: #fdf2f8; color: #db2777; }
      &.errors { background: #fef2f2; color: #ef4444; }
      &.latency { background: #ecfdf5; color: #10b981; }
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $gray-400;
    }

    .metric-value {
      font-size: 1.65rem;
      font-weight: 800;
      color: $gray-900;
      line-height: 1.2;

      .unit {
        font-size: 0.95rem;
        font-weight: 500;
        color: $gray-400;
      }
    }

    .metric-trend {
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 4px;
    }

    .kafka-section {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 24px;
      box-shadow: $shadow-xs;
    }

    .section-title-row {
      @include flex-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid $gray-100;
    }

    .section-title {
      font-size: 1.35rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
      color: $gray-900;

      .material-icons-outlined {
        color: $accent-600;
      }
    }

    .section-sub {
      font-size: 0.875rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .stream-stats {
      font-size: 0.875rem;
      color: $gray-600;
    }

    .empty-stream {
      padding: 60px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: $gray-400;

      .material-icons-outlined {
        font-size: 48px;
      }
    }

    .messages-table-wrapper {
      overflow-x: auto;
    }

    .kafka-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 12px 16px;
        background: $gray-50;
        color: $gray-600;
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid $gray-200;
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid $gray-100;
        color: $gray-800;
      }

      tr:hover td {
        background-color: $gray-50;
      }
    }

    .topic-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: $radius-xs;
      background: #e0e7ff;
      color: #3730a3;
      font-weight: 600;
    }

    .event-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: $radius-xs;
      background: #f1f5f9;
      color: $gray-800;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .schema-version {
      font-size: 0.75rem;
      color: $gray-500;
      font-family: 'JetBrains Mono', monospace;
    }

    .view-payload-btn {
      font-size: 0.75rem;
      font-weight: 600;
      color: $primary-600;
      border: 1px solid $primary-200;
      padding: 4px 10px;
      border-radius: $radius-xs;
      background: $primary-50;
      cursor: pointer;

      &:hover {
        background: $primary-100;
      }
    }

    .payload-row {
      background: #0f172a !important;
    }

    .payload-box {
      padding: 16px;
    }

    .payload-header {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
      display: block;
      margin-bottom: 8px;
    }

    .payload-json {
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitoringComponent {
  readonly telemetry = inject(TelemetryService);
  readonly kafkaProducer = inject(MockKafkaProducer);

  readonly kafkaMessages = this.kafkaProducer.publishedMessages;
  selectedMessageId = signal<string | null>(null);

  togglePayload(id: string): void {
    if (this.selectedMessageId() === id) {
      this.selectedMessageId.set(null);
    } else {
      this.selectedMessageId.set(id);
    }
  }

  formatPayload(event: any): string {
    return JSON.stringify(event, null, 2);
  }
}

