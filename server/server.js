const http = require('http');
const { Kafka, Partitioners } = require('kafkajs');

const PORT = process.env.PORT || 3000;
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TOPIC = 'page_views';

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

// 1. Initialize Kafka Client
const kafka = new Kafka({
  clientId: 'commerce-backend-api',
  brokers: [KAFKA_BROKER],
  retry: {
    retries: 5,
    initialRetryTime: 300
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner
});

const consumer = kafka.consumer({
  groupId: 'analytics-consumer-group-1'
});

// In-memory buffer for real consumed events
const consumedEventsBuffer = [];

async function initKafka() {
  try {
    console.log(`[BACKEND API] Connecting to Kafka broker at ${KAFKA_BROKER}...`);
    await producer.connect();
    console.log('[BACKEND API] Kafka Producer connected successfully.');

    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
    console.log(`[BACKEND API] Kafka Consumer subscribed to topic "${TOPIC}".`);

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const rawValue = message.value ? message.value.toString() : '{}';
        let parsedPayload = {};
        try {
          parsedPayload = JSON.parse(rawValue);
        } catch {
          parsedPayload = { raw: rawValue };
        }

        const consumedRecord = {
          topic,
          partition,
          offset: message.offset,
          key: message.key ? message.key.toString() : 'anonymous',
          timestamp: Number(message.timestamp),
          payload: parsedPayload,
          consumedAt: Date.now()
        };

        consumedEventsBuffer.unshift(consumedRecord);
        if (consumedEventsBuffer.length > 100) consumedEventsBuffer.pop();

        console.log(
          `[KAFKA CONSUMER] Consumed offset #${message.offset} from partition ${partition} | Path: ${parsedPayload.path || '/'}`
        );
      }
    });
  } catch (err) {
    console.error('[BACKEND API] Kafka initialization error:', err.message);
  }
}

// 2. HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', kafkaBroker: KAFKA_BROKER, topic: TOPIC }));
    return;
  }

  // GET /api/analytics/events - Returns real consumed Kafka events
  if (url.pathname === '/api/analytics/events' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      topic: TOPIC,
      consumerGroup: 'analytics-consumer-group-1',
      totalConsumed: consumedEventsBuffer.length,
      events: consumedEventsBuffer
    }));
    return;
  }

  // POST /api/analytics/track - Receives page view event from Angular and sends to Kafka
  if (url.pathname === '/api/analytics/track' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const key = payload.sessionId || payload.userId || 'anonymous-session';

        // Publish to real Kafka topic
        const recordMetadata = await producer.send({
          topic: TOPIC,
          messages: [
            {
              key,
              value: JSON.stringify(payload),
              headers: {
                'correlation-id': 'corr-' + Date.now(),
                'client-type': 'angular-spa',
                'schema-version': '1.0.0'
              }
            }
          ]
        });

        const partitionMetadata = recordMetadata[0] || {};
        const responseData = {
          status: 'INGESTED',
          topic: TOPIC,
          partition: partitionMetadata.partition ?? 0,
          offset: Number(partitionMetadata.baseOffset || 0),
          key,
          eventId: 'ev-' + Date.now(),
          timestamp: Date.now()
        };

        console.log(`[BACKEND API] Successfully sent page_view event to Kafka (Offset #${responseData.offset}, Partition ${responseData.partition})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
      } catch (err) {
        console.error('[BACKEND API] Error producing message to Kafka:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// Start Server & Connect Kafka
initKafka().then(() => {
  server.listen(PORT, () => {
    console.log(`[BACKEND API] Ingestion API running at http://localhost:${PORT}`);
    console.log(`[BACKEND API] Ready to receive page_view events on POST /api/analytics/track`);
  });
});
