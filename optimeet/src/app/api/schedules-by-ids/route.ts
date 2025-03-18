import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST: Get schedules by an array of IDs
export async function POST(request: Request) {
  try {
    const { scheduleIds } = await request.json();

    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      return NextResponse.json({ error: 'Invalid scheduleIds' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: schedules, error } = await supabase
      .from('Schedule')
      .select('*')
      .in('id', scheduleIds);

    if (error) {
      console.error('Supabase error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    return NextResponse.json({ schedules }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
