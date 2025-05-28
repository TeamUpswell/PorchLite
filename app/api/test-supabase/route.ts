import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test connection
    const { data, error } = await supabase.from('user_roles').select('count');
    
    // Test auth
    const sessionResult = await supabase.auth.getSession();
    
    return NextResponse.json({ 
      status: 'ok',
      connection: !error ? 'success' : 'failed',
      sessionCheck: sessionResult.data.session ? 'active' : 'no-session',
      error: error || null,
    });
  } catch (err) {
    console.error('Supabase test error:', err);
    return NextResponse.json({ 
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}