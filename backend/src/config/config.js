const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const brokersList = (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || 'localhost:9092').split(',').map(b => b.trim());

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || undefined,
    keys: {
      products: 'shop:catalog:products',
      categories: 'shop:catalog:categories'
    }
  },
  kafka: {
    broker: brokersList[0],
    brokers: brokersList,
    clientId: process.env.KAFKA_CLIENT_ID || 'shop-backend-api',
    topicPageViews: process.env.KAFKA_TOPIC_PAGE_VIEWS || 'shop.analytics.page_views',
    topicDlq: process.env.KAFKA_TOPIC_DLQ || 'shop.analytics.page_views.dlq',
    consumerGroup: process.env.KAFKA_GROUP_ID || 'shop-analytics-consumer'
  },
  seedData: {
    productsPath: path.resolve(__dirname, '../../data/products.json'),
    categoriesPath: path.resolve(__dirname, '../../data/categories.json')
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};

module.exports = config;
