/**
 * Test endpoint to check Supabase connection
 * GET /api/test-supabase
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 
        'NOT SET',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    client: null,
    connection: null,
    query: null,
  };

  // Check if we can create a client
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        ...results,
        error: 'Missing environment variables',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      });
    }

    // Create client - try with default settings first
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    results.client = 'Created successfully';
    results.nodeVersion = process.version;

    // Test connection by trying to query a simple table
    try {
      const { data, error, status } = await supabase
        .from('sites')
        .select('id')
        .limit(1);

      results.connection = {
        status: status || 'unknown',
        success: !error && status === 200,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        } : null,
        dataCount: data?.length || 0,
      };

      // If that worked, try a more complex query
      if (!error) {
        const { data: countData, error: countError } = await supabase
          .from('sites')
          .select('*', { count: 'exact', head: true });

        results.query = {
          success: !countError,
          count: countData || null,
          error: countError ? {
            message: countError.message,
            code: countError.code,
          } : null,
        };
      }
    } catch (fetchError) {
      results.connection = {
        success: false,
        error: {
          message: fetchError.message,
          type: fetchError.constructor.name,
          name: fetchError.name,
          cause: fetchError.cause ? {
            message: fetchError.cause.message,
            code: fetchError.cause.code,
          } : undefined,
          stack: process.env.NODE_ENV === 'development' ? fetchError.stack : undefined,
        },
      };
      
      // Additional diagnostics
      results.diagnostics = {
        nodeVersion: process.version,
        platform: process.platform,
        urlReachable: 'unknown', // We'll test this separately
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({
      ...results,
      error: {
        message: error.message,
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
}

