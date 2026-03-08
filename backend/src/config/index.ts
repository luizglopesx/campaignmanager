import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Chatwoot
  chatwoot: {
    url: process.env.CHATWOOT_URL || '',
    apiToken: process.env.CHATWOOT_API_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
  },

  // WuzAPI
  wuzapi: {
    endpoint: process.env.WUZAPI_ENDPOINT || '',
    token: process.env.WUZAPI_TOKEN || '',
    instanceId: process.env.WUZAPI_INSTANCE_ID || 'default',
  },

  // Supabase Storage
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'campaign-images',
  },

  // Throttling
  messageDelayMs: parseInt(process.env.MESSAGE_DELAY_MS || '3000', 10),
  maxMessagesPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE || '20', 10),
};
