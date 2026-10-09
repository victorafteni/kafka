import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AnalyticsMonitoringService, KafkaNavigationEvent } from '../../core/services/analytics-monitoring.service';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, AppBadgeComponent],
  template: `
    <div class="monitoring-page">
      <div class="container">
        <!-- Header -->
        <div class="dash-header">
          <div>
            <div class="badge-row">
              <app-badge variant="accent" [dot]="true">Kafka Real-Time Observability</app-badge>
            </div>
            <h1 class="page-title">Monitorizare Evenimente Kafka</h1>
            <p class="subtitle">
              Date consumate în direct din topicul <code>page_views</code> prin grupul <code>shop-analytics-consumer</code>.
            </p>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="live-toggle-btn"
              [class.active]="isLiveMode()"
              (click)="toggleLiveMode()"
              title="Comută actualizarea automată în timp real"
            >
              <span class="live-dot" [class.paused]="!isLiveMode()"></span>
              <span>{{ isLiveMode() ? 'Live Stream Activ (3s)' : 'Live Stream Oprit' }}</span>
            </button>

            <button
              type="button"
              class="refresh-btn"
              (click)="refresh()"
              [disabled]="isLoading()"
              title="Actualizează manual datele din Kafka"
            >
              <span class="material-icons-outlined" [class.spin]="isLoading()">refresh</span>
              <span>Actualizează</span>
            </button>
          </div>
        </div>

        <!-- 4 Real Kafka Metric Cards (eliminat mocks / elemente inutile) -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon stream">
              <span class="material-icons-outlined">hub</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Evenimente Consumate</span>
              <span class="metric-value">{{ stats().totalViews | number }}</span>
              <span class="metric-sub text-primary">Topic: page_views</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon sessions">
              <span class="material-icons-outlined">people</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Sesiuni Unice</span>
              <span class="metric-value">{{ stats().uniqueSessions | number }}</span>
              <span class="metric-sub text-success">Chei sesiune Kafka</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon routes">
              <span class="material-icons-outlined">visibility</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Cea Mai Vizitată Rută</span>
              <span class="metric-value route-val">{{ stats().topRoute || '/' }}</span>
              <span class="metric-sub text-muted">{{ stats().topRouteCount }} vizualizări înregistrate</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon cluster">
              <span class="material-icons-outlined">dns</span>
            </div>
            <div class="metric-info">
              <span class="metric-label">Stare Cluster Kafka</span>
              <span class="metric-value status-val" [class.online]="stats().status === 'ONLINE'">
                {{ stats().status }}
              </span>
              <span class="metric-sub text-muted">Broker: localhost:9092 • 3 partiții</span>
            </div>
          </div>
        </div>

        <!-- Main Kafka Stream Section -->
        <div class="kafka-section">
          <!-- Toolbar & Filters -->
          <div class="toolbar-row">
            <div class="search-box">
              <span class="material-icons-outlined search-icon">search</span>
              <input
                type="text"
                class="search-input"
                placeholder="Filtrează după cale, sesiune, offset, ID..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
              />
              @if (searchQuery()) {
                <button type="button" class="clear-btn" (click)="onSearchChange('')">
                  <span class="material-icons-outlined">close</span>
                </button>
              }
            </div>

            <div class="filter-controls">
              <div class="select-wrapper">
                <span class="select-label">Partiție:</span>
                <select [ngModel]="selectedPartition()" (ngModelChange)="onPartitionChange($event)">
                  <option value="all">Toate partițiile</option>
                  <option value="0">Partiția #0</option>
                  <option value="1">Partiția #1</option>
                  <option value="2">Partiția #2</option>
                </select>
              </div>

              <span class="events-counter">
                Total: <strong>{{ filteredEvents().length }}</strong> evenimente
              </span>
            </div>
          </div>

          <!-- Kafka Events Table -->
          @if (filteredEvents().length === 0) {
            <div class="empty-stream">
              <span class="material-icons-outlined">sensors_off</span>
              <h3>Niciun eveniment Kafka găsit</h3>
              <p>
                @if (searchQuery() || selectedPartition() !== 'all') {
                  Nu există mesaje care să corespundă filtrelor selectate. Încearcă să resetezi căutarea.
                } @else {
                  Nu au fost recepționate mesaje în topicul Kafka încă. Navighează în magazin pentru a genera evenimente!
                }
              </p>
            </div>
          } @else {
            <div class="messages-table-wrapper">
              <table class="kafka-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Topic</th>
                    <th>Partiție</th>
                    <th>Offset</th>
                    <th>Cheie Sesiune</th>
                    <th>Rută / Pagină</th>
                    <th>Tip Eveniment</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  @for (msg of paginatedEvents(); track msg.event_id) {
                    <tr>
                      <td class="font-mono text-muted timestamp-cell">
                        {{ msg.timestamp | date:'HH:mm:ss.SSS' }}
                        <small class="date-sub">{{ msg.timestamp | date:'yyyy-MM-dd' }}</small>
                      </td>
                      <td>
                        <span class="topic-tag">{{ msg.topic }}</span>
                      </td>
                      <td class="font-mono">
                        <span class="partition-badge">#{{ msg.partition }}</span>
                      </td>
                      <td class="font-mono offset-cell">
                        <strong>#{{ msg.offset }}</strong>
                      </td>
                      <td class="font-mono text-muted key-cell" [title]="msg.key">
                        {{ msg.key }}
                      </td>
                      <td>
                        <div class="route-cell">
                          <span class="route-path">{{ msg.path || '/' }}</span>
                          @if (msg.title) {
                            <span class="route-title">{{ msg.title }}</span>
                          }
                        </div>
                      </td>
                      <td>
                        <span class="event-badge">{{ msg.event_type }}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="view-payload-btn"
                          [class.active]="selectedMessageId() === msg.event_id"
                          (click)="togglePayload(msg.event_id)"
                        >
                          {{ selectedMessageId() === msg.event_id ? 'Ascunde' : 'Vezi JSON' }}
                        </button>
                      </td>
                    </tr>
                    @if (selectedMessageId() === msg.event_id) {
                      <tr class="payload-row">
                        <td colspan="8">
                          <div class="payload-box">
                            <div class="payload-header-bar">
                              <span class="payload-header">Kafka Raw Record Payload • Event ID: {{ msg.event_id }}</span>
                              <span class="payload-offset">Partition: {{ msg.partition }} • Offset: {{ msg.offset }}</span>
                            </div>
                            <pre class="payload-json">{{ formatPayload(msg.payload) }}</pre>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination-bar">
                <button
                  type="button"
                  class="page-btn"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                >
                  <span class="material-icons-outlined">chevron_left</span>
                  Înapoi
                </button>

                <span class="page-info">
                  Pagina <strong>{{ currentPage() }}</strong> din <strong>{{ totalPages() }}</strong>
                </span>

                <button
                  type="button"
                  class="page-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                >
                  Înainte
                  <span class="material-icons-outlined">chevron_right</span>
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;
    @use 'styles/mixins' as *;

    .monitoring-page {
      padding: 28px 0 60px;
      background: #f8fafc;
      min-height: calc(100vh - 120px);
    }

    .dash-header {
      @include flex-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid $gray-200;

      @media (max-width: $bp-md) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }

    .badge-row {
      margin-bottom: 6px;
    }

    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: $gray-900;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.9rem;
      color: $gray-500;
      margin-top: 4px;

      code {
        font-family: 'JetBrains Mono', monospace;
        background: #e2e8f0;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #334155;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .live-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 7px 14px;
      border-radius: $radius-full;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: $transition-fast;

      &:hover {
        background: #f1f5f9;
      }

      &.active {
        background: #ecfdf5;
        border-color: #a7f3d0;
        color: #065f46;
      }
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: blink 1.2s infinite ease-in-out;

      &.paused {
        background: #94a3b8;
        animation: none;
      }
    }

    .refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 7px 14px;
      border-radius: $radius-sm;
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-700;
      cursor: pointer;
      transition: $transition-fast;

      &:hover:not(:disabled) {
        background: $primary-50;
        color: $primary-600;
        border-color: $primary-300;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .material-icons-outlined {
        font-size: 18px;

        &.spin {
          animation: spin 1s linear infinite;
        }
      }
    }

    /* Clean 4 Kafka Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-md;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: $shadow-xs;
      transition: transform $transition-fast, box-shadow $transition-fast;

      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-sm;
      }
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: $radius-sm;
      @include flex-center;
      flex-shrink: 0;

      .material-icons-outlined {
        font-size: 22px;
      }

      &.stream { background: #e0e7ff; color: #4338ca; }
      &.sessions { background: #ecfdf5; color: #059669; }
      &.routes { background: #e0f2fe; color: #0284c7; }
      &.cluster { background: #f0fdf4; color: #16a34a; }
    }

    .metric-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .metric-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $gray-500;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: $gray-900;
      line-height: 1.2;
      margin-top: 2px;

      &.route-val {
        font-size: 1.15rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &.status-val {
        font-size: 1.15rem;
        color: #ef4444;

        &.online {
          color: #10b981;
        }
      }
    }

    .metric-sub {
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Main Kafka Section */
    .kafka-section {
      background: #ffffff;
      border: 1px solid $gray-200;
      border-radius: $radius-md;
      padding: 20px;
      box-shadow: $shadow-xs;
    }

    .toolbar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 450px;

      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        color: $gray-400;
      }

      .search-input {
        width: 100%;
        padding: 8px 32px 8px 34px;
        border: 1px solid #cbd5e1;
        border-radius: $radius-sm;
        font-size: 0.875rem;
        color: $gray-900;
        outline: none;
        transition: border-color $transition-fast;

        &:focus {
          border-color: $primary-500;
          box-shadow: 0 0 0 2px rgba($primary-500, 0.15);
        }
      }

      .clear-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        color: $gray-400;
        padding: 2px;
        display: flex;

        &:hover {
          color: $gray-700;
        }

        .material-icons-outlined {
          font-size: 16px;
        }
      }
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .select-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;

      .select-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: $gray-600;
      }

      select {
        padding: 6px 10px;
        border: 1px solid #cbd5e1;
        border-radius: $radius-xs;
        font-size: 0.8125rem;
        background: #ffffff;
        color: $gray-800;
        cursor: pointer;
        outline: none;

        &:focus {
          border-color: $primary-500;
        }
      }
    }

    .events-counter {
      font-size: 0.8125rem;
      color: $gray-600;

      strong {
        color: $primary-700;
      }
    }

    .empty-stream {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: $gray-400;

      .material-icons-outlined {
        font-size: 42px;
        color: $gray-300;
      }

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: $gray-700;
        margin: 0;
      }

      p {
        font-size: 0.875rem;
        color: $gray-500;
        max-width: 480px;
        margin: 0;
      }
    }

    .messages-table-wrapper {
      overflow-x: auto;
    }

    .kafka-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;

      th {
        text-align: left;
        padding: 10px 14px;
        background: #f1f5f9;
        color: #475569;
        font-weight: 700;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid $gray-200;
      }

      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f1f5f9;
        color: $gray-800;
        vertical-align: middle;
      }

      tr:hover td {
        background-color: #f8fafc;
      }
    }

    .timestamp-cell {
      display: flex;
      flex-direction: column;

      .date-sub {
        font-size: 0.6875rem;
        color: $gray-400;
      }
    }

    .topic-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 2px 7px;
      border-radius: $radius-xs;
      background: #e0e7ff;
      color: #3730a3;
      font-weight: 600;
    }

    .partition-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: $radius-xs;
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      font-size: 0.72rem;
    }

    .offset-cell {
      color: #0284c7;
    }

    .key-cell {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .route-cell {
      display: flex;
      flex-direction: column;

      .route-path {
        font-weight: 600;
        color: $gray-900;
      }

      .route-title {
        font-size: 0.7rem;
        color: $gray-500;
      }
    }

    .event-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: $radius-xs;
      background: #ecfdf5;
      color: #047857;
      font-weight: 700;
      font-size: 0.72rem;
    }

    .view-payload-btn {
      font-size: 0.72rem;
      font-weight: 600;
      color: $primary-600;
      border: 1px solid $primary-200;
      padding: 3px 8px;
      border-radius: $radius-xs;
      background: $primary-50;
      cursor: pointer;
      transition: $transition-fast;

      &:hover, &.active {
        background: $primary-600;
        color: #ffffff;
        border-color: $primary-600;
      }
    }

    .payload-row td {
      background: #0f172a !important;
      padding: 0 !important;
    }

    .payload-box {
      padding: 14px 18px;
    }

    .payload-header-bar {
      @include flex-between;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .payload-header {
      font-size: 0.72rem;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .payload-offset {
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
    }

    .payload-json {
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;

      .page-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 12px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        border-radius: $radius-xs;
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-700;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: #f1f5f9;
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .material-icons-outlined {
          font-size: 16px;
        }
      }

      .page-info {
        font-size: 0.8125rem;
        color: $gray-600;
      }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitoringComponent implements OnInit, OnDestroy {
  private analyticsMonitoring = inject(AnalyticsMonitoringService);

  readonly events = this.analyticsMonitoring.events;
  readonly stats = this.analyticsMonitoring.stats;
  readonly isLoading = this.analyticsMonitoring.isLoading;
  readonly error = this.analyticsMonitoring.error;

  readonly isLiveMode = signal<boolean>(true);
  readonly searchQuery = signal<string>('');
  readonly selectedPartition = signal<string>('all');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly selectedMessageId = signal<string | null>(null);

  private liveSubscription: Subscription | null = null;

  readonly filteredEvents = computed<KafkaNavigationEvent[]>(() => {
    const list = this.events();
    const query = this.searchQuery().trim().toLowerCase();
    const partition = this.selectedPartition();

    return list.filter(ev => {
      // Partition filter
      if (partition !== 'all' && String(ev.partition) !== partition) {
        return false;
      }

      // Query filter
      if (!query) return true;

      const matchesPath = (ev.path || '').toLowerCase().includes(query);
      const matchesRoute = (ev.route || '').toLowerCase().includes(query);
      const matchesKey = (ev.key || '').toLowerCase().includes(query);
      const matchesTitle = (ev.title || '').toLowerCase().includes(query);
      const matchesOffset = String(ev.offset).includes(query);
      const matchesEventId = (ev.event_id || '').toLowerCase().includes(query);

      return matchesPath || matchesRoute || matchesKey || matchesTitle || matchesOffset || matchesEventId;
    });
  });

  readonly totalPages = computed<number>(() => {
    const total = this.filteredEvents().length;
    return Math.ceil(total / this.pageSize()) || 1;
  });

  readonly paginatedEvents = computed<KafkaNavigationEvent[]>(() => {
    const all = this.filteredEvents();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  });

  ngOnInit(): void {
    // Initial fetch
    this.refresh();
    this.startLivePolling();
  }

  ngOnDestroy(): void {
    this.stopLivePolling();
  }

  refresh(): void {
    this.analyticsMonitoring.fetchEvents().subscribe();
  }

  toggleLiveMode(): void {
    const nextState = !this.isLiveMode();
    this.isLiveMode.set(nextState);

    if (nextState) {
      this.refresh();
      this.startLivePolling();
    } else {
      this.stopLivePolling();
    }
  }

  private startLivePolling(): void {
    this.stopLivePolling();
    this.liveSubscription = interval(3000).subscribe(() => {
      if (this.isLiveMode()) {
        this.analyticsMonitoring.fetchEvents().subscribe();
      }
    });
  }

  private stopLivePolling(): void {
    if (this.liveSubscription) {
      this.liveSubscription.unsubscribe();
      this.liveSubscription = null;
    }
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onPartitionChange(val: string): void {
    this.selectedPartition.set(val);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

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
