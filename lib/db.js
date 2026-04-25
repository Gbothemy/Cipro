import { Pool } from 'pg';

let pool;
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      throw new Error('Database configuration error');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      isConnected = false;
    });

    // Handle successful connections
    pool.on('connect', () => {
      isConnected = true;
      connectionAttempts = 0;
    });
  }
  return pool;
}

async function retryQuery(queryFn, retries = MAX_RETRIES) {
  try {
    return await queryFn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      console.log(`Query failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return retryQuery(queryFn, retries - 1);
    }
    throw error;
  }
}

function isRetryableError(error) {
  const retryableCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '57P03', // cannot_connect_now
    '53300', // too_many_connections
  ];
  return retryableCodes.includes(error.code);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function query(text, params) {
  return retryQuery(async () => {
    const client = await getPool().connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', {
        message: error.message,
        code: error.code,
        query: text.substring(0, 100),
      });
      throw error;
    } finally {
      client.release();
    }
  });
}

export async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as time, version() as version');
    return {
      status: 'healthy',
      connected: isConnected,
      timestamp: result.rows[0].time,
      version: result.rows[0].version.split(' ')[0],
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
    };
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
  }
}
