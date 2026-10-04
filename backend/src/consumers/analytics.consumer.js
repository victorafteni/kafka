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
        fromBeginning: false
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
    const record = {
      event_id: event.event_id,
      event_type: event.event_type,
      topic: config.kafka.topicPageViews,
      partition,
      offset: Number(offset),
      key: event.session_id || event.anonymous_id || 'anonymous',
      timestamp: event.timestamp || new Date().toISOString(),
      payload: event.payload || {},
      consumedAt: Date.now()
    };

    this.consumedEvents.unshift(record);
    if (this.consumedEvents.length > this.maxBufferedEvents) {
      this.consumedEvents.pop();
    }
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

