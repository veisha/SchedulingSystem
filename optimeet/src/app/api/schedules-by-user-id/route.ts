import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  console.log('📥 Incoming GET request for schedules. userId:', userId);

  if (!userId) {
    console.error('❌ Missing userId in query params.');
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const { data: schedules, error } = await supabase
      .from('Schedule')
      .select('*')
      .eq('userId', userId)
      .order('startDateTime', { ascending: true });

    if (error) {
      console.error("❌ Supabase query error:", error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    console.log(`✅ Retrieved ${schedules.length} schedules for userId: ${userId}`);

    return NextResponse.json({ schedules }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Unexpected error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    console.error("❌ Unknown error:", error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
  
}
