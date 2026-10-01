import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryService } from '../../core/services/telemetry.service';
import { MockKafkaProducer } from '../../core/event-bus/mock-kafka.producer';
import { TrackingService } from '../../core/services/tracking.service';
import { KafkaConsumerService } from '../../core/event-bus/kafka-consumer.service';
import { AnalyticsStoreService } from '../../core/services/analytics-store.service';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, AppBadgeComponent],
  template: `
    <div class="monitoring-page">
      <div class="container">
        <!-- Dashboard Header -->
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

        <!-- Telemetry Metrics Grid -->
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
            <div class="metric-icon pageview">
              <span class="material-icons-outlined">visibility</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Page Views Ingested</span>
              <span class="metric-value">{{ analyticsStore.totalPageViews() | number }}</span>
              <span class="metric-trend text-accent">Kafka topic: page_views</span>
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

        <!-- End-to-End Event Streaming Architecture Card -->
        <div class="pipeline-flow-card">
          <div class="flow-header">
            <div>
              <div class="flow-badge-wrap">
                <span class="flow-tag">EVENT-DRIVEN ARCHITECTURE</span>
                <span class="flow-status"><span class="dot-online"></span> Pipeline Active</span>
              </div>
              <h2 class="flow-title">Page View Tracking & Kafka Analytics Pipeline</h2>
              <p class="flow-desc">
                Traces end-to-end data flow: <strong>Angular localhost</strong> &rarr; <strong>Tracking Service</strong> &rarr; <strong>Backend API</strong> &rarr; <strong>Kafka (page_views topic)</strong> &rarr; <strong>Kafka Consumer</strong> &rarr; <strong>Database / Analytics</strong>.
              </p>
            </div>
            <div class="flow-actions">
              <button
                type="button"
                class="simulate-btn"
                [disabled]="isSimulating()"
                (click)="simulatePageView('/products', 'Product Catalog | Telefoane')">
                <span class="material-icons-outlined">play_circle</span>
                <span>{{ isSimulating() ? 'Emitting & Processing...' : 'Emit Test page_view Event' }}</span>
              </button>
            </div>
          </div>

          <!-- Interactive Node Pipeline Diagram -->
          <div class="pipeline-diagram">
            <!-- Node 1: Angular localhost -->
            <div class="p-node" [class.active-node]="highlightedStep() === 1">
              <div class="node-icon bg-angular">
                <span class="material-icons-outlined">laptop_mac</span>
              </div>
              <div class="node-content">
                <span class="node-layer">ORIGIN</span>
                <span class="node-title">Angular localhost</span>
                <span class="node-detail">Router NavigationEnd</span>
              </div>
              <div class="node-badge">
                <strong>{{ tracking.totalTrackedCount() }}</strong>
                <span>emissions</span>
              </div>
            </div>

            <div class="p-arrow" [class.active-arrow]="highlightedStep() === 1 || highlightedStep() === 2">
              <span class="arrow-text">page_view</span>
              <span class="material-icons-outlined arrow-glyph">east</span>
            </div>

            <!-- Node 2: Tracking Service -->
            <div class="p-node" [class.active-node]="highlightedStep() === 2">
              <div class="node-icon bg-tracking">
                <span class="material-icons-outlined">gps_fixed</span>
              </div>
              <div class="node-content">
                <span class="node-layer">CORE SERVICE</span>
                <span class="node-title">Tracking Service</span>
                <span class="node-detail">Metadata & Session</span>
              </div>
              <div class="node-badge">
                <strong class="font-mono">{{ tracking.sessionId.substring(0, 8) }}</strong>
                <span>session ID</span>
              </div>
            </div>

            <div class="p-arrow" [class.active-arrow]="highlightedStep() === 2 || highlightedStep() === 3">
              <span class="arrow-text">HTTP POST</span>
              <span class="material-icons-outlined arrow-glyph">east</span>
            </div>

            <!-- Node 3: Backend API -->
            <div class="p-node" [class.active-node]="highlightedStep() === 3">
              <div class="node-icon bg-backend">
                <span class="material-icons-outlined">cloud_upload</span>
              </div>
              <div class="node-content">
                <span class="node-layer">INGESTION</span>
                <span class="node-title">Backend API</span>
                <span class="node-detail">/api/analytics/track</span>
              </div>
              <div class="node-badge text-success">
                <strong>200 OK</strong>
                <span>{{ telemetry.averageResponseTime() }}ms latency</span>
              </div>
            </div>

            <div class="p-arrow" [class.active-arrow]="highlightedStep() === 3 || highlightedStep() === 4">
              <span class="arrow-text">publish()</span>
              <span class="material-icons-outlined arrow-glyph">east</span>
            </div>

            <!-- Node 4: Kafka page_views topic -->
            <div class="p-node" [class.active-node]="highlightedStep() === 4">
              <div class="node-icon bg-kafka">
                <span class="material-icons-outlined">hub</span>
              </div>
              <div class="node-content">
                <span class="node-layer">EVENT BROKER</span>
                <span class="node-title">Kafka Broker</span>
                <span class="node-detail">topic: page_views</span>
              </div>
              <div class="node-badge text-primary">
                <strong>#{{ kafkaConsumer.committedOffset() }}</strong>
                <span>partition 0</span>
              </div>
            </div>

            <div class="p-arrow" [class.active-arrow]="highlightedStep() === 4 || highlightedStep() === 5">
              <span class="arrow-text">subscribe()</span>
              <span class="material-icons-outlined arrow-glyph">east</span>
            </div>

            <!-- Node 5: Kafka Consumer -->
            <div class="p-node" [class.active-node]="highlightedStep() === 5">
              <div class="node-icon bg-consumer">
                <span class="material-icons-outlined">input</span>
              </div>
              <div class="node-content">
                <span class="node-layer">CONSUMER GROUP</span>
                <span class="node-title">Kafka Consumer</span>
                <span class="node-detail">analytics-service-group</span>
              </div>
              <div class="node-badge text-warning">
                <strong>{{ kafkaConsumer.totalConsumed() }}</strong>
                <span>consumed (0 lag)</span>
              </div>
            </div>

            <div class="p-arrow" [class.active-arrow]="highlightedStep() === 5 || highlightedStep() === 6">
              <span class="arrow-text">aggregate</span>
              <span class="material-icons-outlined arrow-glyph">east</span>
            </div>

            <!-- Node 6: Database / Analytics -->
            <div class="p-node" [class.active-node]="highlightedStep() === 6">
              <div class="node-icon bg-db">
                <span class="material-icons-outlined">query_stats</span>
              </div>
              <div class="node-content">
                <span class="node-layer">DATA STORE</span>
                <span class="node-title">Database / Analytics</span>
                <span class="node-detail">Time-Series Aggregation</span>
              </div>
              <div class="node-badge text-purple">
                <strong>{{ analyticsStore.totalPageViews() }}</strong>
                <span>stored records</span>
              </div>
            </div>
          </div>

          @if (simulationNotice()) {
            <div class="simulation-alert">
              <span class="material-icons-outlined">check_circle</span>
              <span>{{ simulationNotice() }}</span>
            </div>
          }
        </div>

        <!-- Section Navigation Tabs -->
        <div class="view-tabs">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'page_views'"
            (click)="activeTab.set('page_views')">
            <span class="material-icons-outlined">insights</span>
            <span>page_views Topic & Consumer Analytics ({{ analyticsStore.recentPageViews().length }})</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'all_kafka'"
            (click)="activeTab.set('all_kafka')">
            <span class="material-icons-outlined">hub</span>
            <span>All Kafka Topics Stream ({{ kafkaMessages().length }})</span>
          </button>
        </div>

        <!-- TAB 1: page_views Consumer Stream & Analytics Store -->
        @if (activeTab() === 'page_views') {
          <div class="analytics-tab-content">
            <!-- Top Pages Distribution Grid -->
            <div class="analytics-overview-row">
              <div class="analytics-card routes-card">
                <div class="card-head">
                  <h3 class="card-title">
                    <span class="material-icons-outlined">bar_chart</span>
                    Database Page Views by Route
                  </h3>
                  <span class="card-meta">Real-time Ingested Counts</span>
                </div>
                <div class="routes-list">
                  @for (page of analyticsStore.topPages(); track page.path) {
                    <div class="route-item">
                      <div class="route-info">
                        <span class="route-path font-mono">{{ page.path }}</span>
                        <span class="route-title">{{ page.title }}</span>
                      </div>
                      <div class="route-metric">
                        <div class="route-bar-wrap">
                          <div class="route-bar-fill" [style.width.%]="page.percentage"></div>
                        </div>
                        <span class="route-views"><strong>{{ page.views }}</strong> views ({{ page.percentage }}%)</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="analytics-card consumer-info-card">
                <div class="card-head">
                  <h3 class="card-title">
                    <span class="material-icons-outlined">tune</span>
                    Kafka Consumer Metadata
                  </h3>
                  <span class="status-pill status-running">RUNNING</span>
                </div>
                <div class="consumer-details">
                  <div class="detail-row">
                    <span class="d-label">Consumer Group:</span>
                    <span class="d-value font-mono">{{ kafkaConsumer.consumerGroupId() }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="d-label">Subscribed Topic:</span>
                    <span class="d-value font-mono topic-tag">page_views</span>
                  </div>
                  <div class="detail-row">
                    <span class="d-label">Assigned Partitions:</span>
                    <span class="d-value font-mono">[ 0 ]</span>
                  </div>
                  <div class="detail-row">
                    <span class="d-label">Committed Offset:</span>
                    <span class="d-value font-mono">#{{ kafkaConsumer.committedOffset() }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="d-label">Consumer Lag:</span>
                    <span class="d-value text-success font-mono">0 ms (Real-Time)</span>
                  </div>
                  <div class="detail-row">
                    <span class="d-label">Unique Sessions:</span>
                    <span class="d-value font-mono">{{ analyticsStore.uniqueSessionsCount() }} active sessions</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consumed page_views Records Table -->
            <div class="kafka-section">
              <div class="section-title-row">
                <div>
                  <h3 class="section-title">
                    <span class="material-icons-outlined">table_rows</span>
                    Consumed Records Stream: topic "page_views"
                  </h3>
                  <p class="section-sub">
                    Live records pulled from Kafka by consumer group and indexed into the analytics database.
                  </p>
                </div>
                <div class="stream-stats">
                  <span>Consumer Offset: <strong>#{{ kafkaConsumer.committedOffset() }}</strong></span>
                </div>
              </div>

              <div class="messages-table-wrapper">
                <table class="kafka-table">
                  <thead>
                    <tr>
                      <th>Consumed At</th>
                      <th>Topic</th>
                      <th>Offset</th>
                      <th>Route / URL</th>
                      <th>Session ID</th>
                      <th>Lag</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (record of analyticsStore.recentPageViews(); track record.id) {
                      <tr>
                        <td class="font-mono text-muted">{{ record.consumedAt | date:'HH:mm:ss.SSS' }}</td>
                        <td><span class="topic-tag">{{ record.topic }}</span></td>
                        <td class="font-mono">#{{ record.offset }}</td>
                        <td>
                          <span class="route-tag font-mono">{{ record.payload.path }}</span>
                          <span class="route-title-small">{{ record.payload.title }}</span>
                        </td>
                        <td class="font-mono text-muted">{{ record.payload.sessionId.substring(0, 12) }}...</td>
                        <td class="font-mono text-success">{{ record.processingLagMs }}ms</td>
                        <td><span class="status-badge-ok">Committed &amp; Stored</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- TAB 2: All Kafka Topics Stream -->
        @if (activeTab() === 'all_kafka') {
          <div class="kafka-section">
            <div class="section-title-row">
              <div>
                <h2 class="section-title">
                  <span class="material-icons-outlined">hub</span>
                  Kafka Producer Event Log (All Topics)
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
        }
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .monitoring-page {
      padding: 40px 0 80px;
      background-color: #f8fafc;
      min-height: calc(100vh - 140px);
    }

    .dash-header {
      @include flex-between;
      margin-bottom: 32px;

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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-lg;
      padding: 18px;
      display: flex;
      gap: 14px;
      box-shadow: $shadow-xs;
      transition: transform $transition-fast;

      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-md;
      }
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.api { background: #eff6ff; color: #3b82f6; }
      &.pageview { background: #fdf2f8; color: #ec4899; }
      &.search { background: #ecfeff; color: #06b6d4; }
      &.cart { background: #fdf4ff; color: #a855f7; }
      &.latency { background: #f0fdf4; color: #10b981; }

      .material-icons-outlined {
        font-size: 24px;
      }
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $gray-500;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: $gray-900;
      line-height: 1.2;
      margin: 2px 0;

      .unit {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-500;
      }
    }

    .metric-trend {
      font-size: 0.6875rem;
      font-weight: 600;
    }

    /* Pipeline Flow Architecture Card */
    .pipeline-flow-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-xl;
      padding: 28px;
      margin-bottom: 32px;
      box-shadow: $shadow-sm;
    }

    .flow-header {
      @include flex-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .flow-badge-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .flow-tag {
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #6366f1;
      background: #e0e7ff;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .flow-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #065f46;

      .dot-online {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
      }
    }

    .flow-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: $gray-900;
      margin: 0;
    }

    .flow-desc {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 4px 0 0;

      strong {
        color: $gray-800;
      }
    }

    .simulate-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: $radius-md;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
      transition: $transition-fast;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .material-icons-outlined {
        font-size: 20px;
      }
    }

    .pipeline-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      overflow-x: auto;
      padding: 16px 8px 8px;

      @media (max-width: 1200px) {
        justify-content: flex-start;
      }
    }

    .p-node {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: $radius-lg;
      padding: 14px 12px;
      min-width: 155px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.3s ease;

      &.active-node {
        border-color: #6366f1;
        background: #eef2ff;
        transform: translateY(-4px) scale(1.03);
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
      }
    }

    .node-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;

      &.bg-angular { background: #fee2e2; color: #ef4444; }
      &.bg-tracking { background: #e0e7ff; color: #4f46e5; }
      &.bg-backend { background: #ecfeff; color: #0891b2; }
      &.bg-kafka { background: #ffedd5; color: #ea580c; }
      &.bg-consumer { background: #fef3c7; color: #d97706; }
      &.bg-db { background: #f3e8ff; color: #9333ea; }

      .material-icons-outlined {
        font-size: 20px;
      }
    }

    .node-content {
      display: flex;
      flex-direction: column;
      margin-bottom: 10px;
    }

    .node-layer {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #94a3b8;
    }

    .node-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      margin: 1px 0;
    }

    .node-detail {
      font-size: 0.6875rem;
      color: $gray-500;
    }

    .node-badge {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.6875rem;
      display: flex;
      flex-direction: column;

      strong {
        font-size: 0.75rem;
      }

      span {
        color: #94a3b8;
        font-size: 0.625rem;
      }
    }

    .p-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
      color: #94a3b8;
      transition: color 0.3s ease;

      &.active-arrow {
        color: #6366f1;

        .arrow-glyph {
          transform: translateX(3px);
        }
      }

      .arrow-text {
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .arrow-glyph {
        font-size: 18px;
        transition: transform 0.2s ease;
      }
    }

    .simulation-alert {
      margin-top: 20px;
      padding: 10px 16px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: $radius-md;
      color: #065f46;
      font-size: 0.8125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      .material-icons-outlined {
        font-size: 18px;
        color: #10b981;
      }
    }

    /* Tabs */
    .view-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      border-bottom: 1px solid $gray-200;
      padding-bottom: 8px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: $radius-md;
      border: none;
      background: transparent;
      color: $gray-600;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: $transition-fast;

      &:hover {
        color: $gray-900;
        background: #f1f5f9;
      }

      &.active {
        color: #4f46e5;
        background: #eef2ff;
        font-weight: 700;
      }

      .material-icons-outlined {
        font-size: 18px;
      }
    }

    /* Analytics Tab Content */
    .analytics-overview-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 32px;

      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
      }
    }

    .analytics-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-xl;
      padding: 24px;
      box-shadow: $shadow-xs;
    }

    .card-head {
      @include flex-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid $gray-100;
    }

    .card-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: $gray-900;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;

      .material-icons-outlined {
        color: #6366f1;
      }
    }

    .card-meta {
      font-size: 0.75rem;
      color: $gray-500;
      font-weight: 600;
    }

    .routes-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .route-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .route-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .route-path {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #3b82f6;
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .route-title {
      font-size: 0.75rem;
      color: $gray-500;
    }

    .route-metric {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .route-bar-wrap {
      flex: 1;
      height: 8px;
      background: #f1f5f9;
      border-radius: $radius-full;
      overflow: hidden;
    }

    .route-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #3b82f6);
      border-radius: $radius-full;
      transition: width 0.4s ease;
    }

    .route-views {
      font-size: 0.75rem;
      color: $gray-600;
      min-width: 100px;
      text-align: right;
    }

    .consumer-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      padding: 6px 0;
      border-bottom: 1px dashed $gray-100;

      .d-label {
        color: $gray-500;
      }

      .d-value {
        color: $gray-900;
        font-weight: 600;
      }
    }

    .status-pill {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: $radius-full;

      &.status-running {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
    }

    /* Kafka Table */
    .kafka-section {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-xl;
      padding: 24px;
      box-shadow: $shadow-xs;
    }

    .section-title-row {
      @include flex-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid $gray-200;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: $gray-900;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;

      .material-icons-outlined {
        color: #4f46e5;
      }
    }

    .section-sub {
      font-size: 0.8125rem;
      color: $gray-500;
      margin-top: 4px;
    }

    .stream-stats {
      font-size: 0.875rem;
      color: $gray-600;

      strong {
        color: #4f46e5;
      }
    }

    .messages-table-wrapper {
      overflow-x: auto;
    }

    .kafka-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8125rem;

      th {
        padding: 10px 14px;
        background: $gray-50;
        color: $gray-600;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.6875rem;
        border-bottom: 1px solid $gray-200;
      }

      td {
        padding: 12px 14px;
        border-bottom: 1px solid $gray-100;
        vertical-align: middle;
      }

      tr:hover td {
        background: #f8fafc;
      }
    }

    .topic-tag {
      background: #eff6ff;
      color: #2563eb;
      font-family: monospace;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .route-tag {
      background: #f1f5f9;
      color: #0f172a;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      display: inline-block;
      margin-right: 6px;
    }

    .route-title-small {
      color: $gray-500;
      font-size: 0.75rem;
    }

    .status-badge-ok {
      background: #ecfdf5;
      color: #047857;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .event-badge {
      background: #fdf2f8;
      color: #db2777;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .schema-version {
      font-family: monospace;
      font-size: 0.6875rem;
      color: $gray-600;
      background: $gray-100;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .view-payload-btn {
      background: $primary-50;
      color: $primary-700;
      border: 1px solid $primary-200;
      padding: 4px 10px;
      border-radius: $radius-sm;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: $transition-fast;

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
      font-family: monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .empty-stream {
      text-align: center;
      padding: 48px;
      color: $gray-400;

      .material-icons-outlined {
        font-size: 40px;
        margin-bottom: 8px;
      }
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
  readonly tracking = inject(TrackingService);
  readonly kafkaConsumer = inject(KafkaConsumerService);
  readonly analyticsStore = inject(AnalyticsStoreService);

  readonly kafkaMessages = this.kafkaProducer.publishedMessages;
  selectedMessageId = signal<string | null>(null);

  activeTab = signal<'page_views' | 'all_kafka'>('page_views');
  highlightedStep = signal<number>(0);
  isSimulating = signal<boolean>(false);
  simulationNotice = signal<string | null>(null);

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

  simulatePageView(path: string, title: string): void {
    if (this.isSimulating()) return;
    this.isSimulating.set(true);
    this.simulationNotice.set('Step 1/6: Angular localhost fired page_view event...');

    // Step 1: Angular localhost
    this.highlightedStep.set(1);

    setTimeout(() => {
      // Step 2: Tracking Service
      this.highlightedStep.set(2);
      this.simulationNotice.set('Step 2/6: Tracking Service enriched event with session & metadata...');

      setTimeout(() => {
        // Step 3: Backend API
        this.highlightedStep.set(3);
        this.simulationNotice.set('Step 3/6: Backend API received HTTP request and forwarded to Kafka...');

        this.tracking.trackPageView({ path, title }).subscribe(record => {
          setTimeout(() => {
            // Step 4: Kafka Broker
            this.highlightedStep.set(4);
            this.simulationNotice.set(`Step 4/6: Kafka published to topic "page_views" (Offset #${record.offset})...`);

            setTimeout(() => {
              // Step 5: Kafka Consumer
              this.highlightedStep.set(5);
              this.simulationNotice.set('Step 5/6: Kafka Consumer (analytics-service-group) pulled record...');

              setTimeout(() => {
                // Step 6: Database / Analytics
                this.highlightedStep.set(6);
                this.simulationNotice.set(`Step 6/6: Database / Analytics aggregated view for "${path}"!`);

                setTimeout(() => {
                  this.highlightedStep.set(0);
                  this.isSimulating.set(false);
                }, 2000);
              }, 400);
            }, 300);
          }, 300);
        });
      }, 300);
    }, 300);
  }
}
