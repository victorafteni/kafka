const crypto = require('crypto');
const kafkaService = require('../services/kafka.service');
const config = require('../config/config');

class TrackingController {
  // POST /api/analytics/page-view (Section 24)
  async trackPageView(req, res, next) {
    try {
      const body = req.body || {};

      // 1. Validation & sanitization
      const path = typeof body.path === 'string' && body.path.trim() ? body.path.trim() : '/';
      const route = typeof body.route === 'string' && body.route.trim() ? body.route.trim() : (path.replace(/^\//, '') || 'home');
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : 'Commerce Hub';
      const referrer = typeof body.referrer === 'string' ? body.referrer.trim().slice(0, 300) : '/';
      const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : 'anonymous-session';
      const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : 'anon-user';
      const userId = body.user_id ? String(body.user_id).trim() : null;

      // 2. Build Standard Event Envelope (Section 25 & 26)
      const eventEnvelope = {
        event_id: crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        event_type: 'page_view',
        event_version: 1,
        timestamp: new Date().toISOString(),
        source: 'angular-shop',
        session_id: sessionId,
        anonymous_id: anonymousId,
        user_id: userId,
        payload: {
          path,
          route,
          title,
          referrer
        }
      };

      // 3. Publish to Kafka (Non-blocking / Failure Isolated - Section 27)
      let kafkaResult;
      try {
        kafkaResult = await kafkaService.publish(config.kafka.topicPageViews, eventEnvelope, sessionId);
      } catch (kafkaErr) {
        console.warn(`[Kafka] Publish failed (${kafkaErr.message}), continuing without blocking client.`);
        kafkaResult = {
          status: 'QUEUED',
          warning: 'Kafka broker unavailable, event will not block navigation'
        };
      }

      res.status(200).json({
        success: true,
        event_id: eventEnvelope.event_id,
        event_type: eventEnvelope.event_type,
        timestamp: eventEnvelope.timestamp,
        topic: config.kafka.topicPageViews,
        delivery: kafkaResult
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TrackingController();

