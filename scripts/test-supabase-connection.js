/**
 * Quick script to test Supabase connection
 * Run with: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   process.env.SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Connection Test\n');
console.log('Environment Variables:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing required environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('\n📡 Testing Connection...\n');

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Simple query
  console.log('Test 1: Querying sites table...');
  const { data, error, status } = await supabase
    .from('sites')
    .select('id, name')
    .limit(5);

  if (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
  } else {
    console.log('✓ Query successful!');
    console.log('   Status:', status);
    console.log('   Results:', data?.length || 0, 'sites found');
    if (data && data.length > 0) {
      console.log('   Sample:', data[0]);
    }
  }

  // Test 2: Count query
  console.log('\nTest 2: Counting sites...');
  const { count, error: countError } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Count failed:', countError.message);
  } else {
    console.log('✓ Count successful!');
    console.log('   Total sites:', count);
  }

  console.log('\n✅ Supabase connection is working!\n');
} catch (error) {
  console.error('\n❌ Connection failed!');
  console.error('Error:', error.message);
  console.error('Type:', error.constructor.name);
  if (error.cause) {
    console.error('Cause:', error.cause);
  }
  process.exit(1);
}

