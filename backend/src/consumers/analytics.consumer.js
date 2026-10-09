const { Kafka } = require('kafkajs');
const config = require('../config/config');
const kafkaService = require('../services/kafka.service');

class AnalyticsConsumer {
  constructor() {
    this.kafka = new Kafka({
      clientId: `${config.kafka.clientId}-consumer`,
      brokers: config.kafka.brokers
    });

    this.consumer = this.kafka.consumer({
      groupId: config.kafka.consumerGroup
    });

    this.isRunning = false;
    this.processedEventIds = new Set();
    this.consumedEvents = [];
    this.maxBufferedEvents = 100;
  }

  async start() {
    if (this.isRunning) return;

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: config.kafka.topicPageViews,
        fromBeginning: true
      });

      console.log(`[Kafka] Consumer started (Group: ${config.kafka.consumerGroup}, Topic: ${config.kafka.topicPageViews})`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.processMessage(topic, partition, message);
        }
      });

      this.isRunning = true;
    } catch (err) {
      console.warn(`[Kafka] Consumer startup warning: ${err.message}. Will be re-attempted.`);
    }
  }

  async processMessage(topic, partition, message) {
    const rawValue = message.value ? message.value.toString() : '{}';
    let event = {};

    try {
      event = JSON.parse(rawValue);
    } catch (parseErr) {
      console.error(`[Kafka] Event failed: Invalid JSON payload`, parseErr.message);
      await this.sendToDlq({ raw: rawValue, error: parseErr.message, partition, offset: message.offset });
      return;
    }

    const eventId = event.event_id || `ev-auto-${Date.now()}`;

    // Section 31: Idempotency Check
    if (this.processedEventIds.has(eventId)) {
      console.log(`[Kafka] Duplicate event ignored (event_id: ${eventId})`);
      return;
    }

    // Process event with retry logic (Section 32)
    let attempts = 0;
    const maxAttempts = 2;
    let processedSuccessfully = false;

    while (attempts < maxAttempts && !processedSuccessfully) {
      attempts++;
      try {
        // Business processing of page_view event
        this.handleEvent(event, partition, message.offset);
        this.processedEventIds.add(eventId);

        // Keep set size bounded
        if (this.processedEventIds.size > 5000) {
          const firstKey = this.processedEventIds.values().next().value;
          this.processedEventIds.delete(firstKey);
        }

        processedSuccessfully = true;
        console.log(
          `[Kafka] Event processed (ID: ${eventId}, Type: ${event.event_type || 'page_view'}, ` +
          `Path: ${event.payload?.path || event.path || '/'}, Offset: #${message.offset})`
        );
      } catch (procErr) {
        console.error(`[Kafka] Event processing attempt ${attempts} failed: ${procErr.message}`);
        if (attempts >= maxAttempts) {
          console.error(`[Kafka] Event failed after ${maxAttempts} attempts, routing to DLQ: ${config.kafka.topicDlq}`);
          await this.sendToDlq({ event, error: procErr.message, failedAt: new Date().toISOString() });
        }
      }
    }
  }

  handleEvent(event, partition, offset) {
    const payload = event.payload || {};
    const path = payload.path || event.path || '/';
    const route = payload.route || event.route || (path.replace(/^\//, '') || 'home');
    const title = payload.title || event.title || 'Commerce Hub';
    const sessionId = event.session_id || payload.sessionId || 'anonymous';
    const anonymousId = event.anonymous_id || payload.anonymousId || null;
    const userId = event.user_id || payload.userId || null;

    const record = {
      event_id: event.event_id || `ev-${Date.now()}`,
      event_type: event.event_type || 'PAGE_VIEW',
      topic: config.kafka.topicPageViews,
      partition: Number(partition),
      offset: Number(offset),
      key: sessionId,
      session_id: sessionId,
      anonymous_id: anonymousId,
      user_id: userId,
      path,
      route,
      title,
      timestamp: event.timestamp || new Date().toISOString(),
      payload: {
        path,
        route,
        title,
        session_id: sessionId,
        referrer: payload.referrer || event.referrer || '/',
        ...payload
      },
      consumedAt: Date.now()
    };

    this.consumedEvents.unshift(record);
    if (this.consumedEvents.length > this.maxBufferedEvents) {
      this.consumedEvents.pop();
    }
  }

  getStats() {
    const total = this.consumedEvents.length;
    const sessionSet = new Set();
    const routeCounts = {};
    const partitionsSet = new Set();

    for (const ev of this.consumedEvents) {
      if (ev.session_id && ev.session_id !== 'anonymous') {
        sessionSet.add(ev.session_id);
      } else if (ev.key) {
        sessionSet.add(ev.key);
      }
      if (ev.partition !== undefined) partitionsSet.add(ev.partition);
      const r = ev.route || ev.path || 'home';
      routeCounts[r] = (routeCounts[r] || 0) + 1;
    }

    let topRoute = 'home';
    let topRouteCount = 0;
    for (const [r, count] of Object.entries(routeCounts)) {
      if (count > topRouteCount) {
        topRoute = r;
        topRouteCount = count;
      }
    }

    return {
      totalViews: total,
      uniqueSessions: sessionSet.size || (total > 0 ? 1 : 0),
      topRoute: total > 0 ? topRoute : 'None',
      topRouteCount,
      activeBrokers: 1,
      activePartitions: partitionsSet.size || 3,
      routeDistribution: routeCounts,
      latestTimestamp: this.consumedEvents[0]?.timestamp || null,
      status: this.isRunning ? 'ONLINE' : 'OFFLINE'
    };
  }

  async sendToDlq(dlqPayload) {
    try {
      await kafkaService.publish(config.kafka.topicDlq, dlqPayload);
      console.log(`[Kafka] Message successfully forwarded to DLQ "${config.kafka.topicDlq}"`);
    } catch (dlqErr) {
      console.error(`[Kafka] Failed to publish to DLQ:`, dlqErr.message);
    }
  }

  async stop() {
    if (this.isRunning) {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('[Kafka] Consumer stopped cleanly.');
    }
  }

  getConsumedEvents() {
    return this.consumedEvents;
  }
}

module.exports = new AnalyticsConsumer();

