import { NextResponse } from 'next/server';
import { healthCheck } from '../../../lib/db';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
    vercelUrl: process.env.VERCEL_URL || 'localhost',
    
    // Database configuration
    databaseConfigured: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT SET',
    databaseUrlHasSsl: process.env.DATABASE_URL?.includes('sslmode=require') || false,
    
    // Mock data settings
    useMockData: process.env.USE_MOCK_DATA === 'true',
    mockDataForced: process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL,
    
    // All environment variables (keys only, no values)
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || 
      key.includes('VERCEL') || 
      key.includes('NODE') ||
      key.includes('MOCK')
    ),
  };

  // Try database health check
  let dbHealth = null;
  try {
    if (process.env.DATABASE_URL) {
      dbHealth = await healthCheck();
    } else {
      dbHealth = { status: 'not-configured', message: 'DATABASE_URL not set' };
    }
  } catch (error) {
    dbHealth = { 
      status: 'error', 
      message: error.message,
      code: error.code 
    };
  }

  return NextResponse.json({
    ...diagnostics,
    databaseHealth: dbHealth,
    recommendation: getDiagnosticRecommendation(diagnostics, dbHealth)
  }, { status: 200 });
}

function getDiagnosticRecommendation(diagnostics, dbHealth) {
  if (!diagnostics.databaseConfigured) {
    return {
      issue: 'DATABASE_URL not set',
      solution: 'Add DATABASE_URL environment variable in Vercel Dashboard → Settings → Environment Variables',
      steps: [
        '1. Go to https://vercel.com/dashboard',
        '2. Select your project',
        '3. Go to Settings → Environment Variables',
        '4. Add DATABASE_URL with your Neon connection string',
        '5. Enable for Production, Preview, and Development',
        '6. Redeploy the application'
      ]
    };
  }

  if (!diagnostics.databaseUrlHasSsl && diagnostics.platform === 'Vercel') {
    return {
      issue: 'DATABASE_URL missing SSL mode',
      solution: 'Add ?sslmode=require to the end of your DATABASE_URL',
      example: 'postgresql://user:pass@host/db?sslmode=require'
    };
  }

  if (dbHealth?.status === 'unhealthy') {
    return {
      issue: 'Database connection failed',
      solution: 'Check if your Neon database is active and connection string is correct',
      steps: [
        '1. Go to https://console.neon.tech',
        '2. Check if database is Active (not paused)',
        '3. Verify connection string is correct',
        '4. Make sure tables are created (run DATABASE-SETUP.sql)'
      ]
    };
  }

  if (dbHealth?.status === 'healthy') {
    return {
      issue: 'None - Database is working!',
      solution: 'Everything looks good',
      message: '✅ Database is connected and healthy'
    };
  }

  return {
    issue: 'Unknown',
    solution: 'Check Vercel function logs for more details'
  };
}
