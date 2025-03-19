import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // Fetch schedules where userId matches
    const { data: schedules, error } = await supabase
      .from('Schedule')
      .select('*')
      .eq('userId', userId)
      .order('startDateTime', { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
