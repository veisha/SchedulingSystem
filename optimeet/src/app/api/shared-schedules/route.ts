import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST method: Add a shared schedule
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 401 });
    }

    const { id, scheduleIds } = await request.json();

    console.log('Received payload:', { id, userId: user.id, scheduleIds });

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('SharedSchedule')
      .insert([
        {
          id,
          userId: user.id,
          scheduleIds,
          createdAt: now,
          updatedAt: now,
        },
      ]);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Unknown Supabase error');
    }

    console.log('Insert successful:', data);

    return NextResponse.json(
      { message: 'Shared schedule saved successfully' },
      { status: 200 }
    );
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

// ✅ NEW: GET method - Fetch shared schedules
export async function GET(request: Request) {
  try {
    // Optional: parse query parameters if you want to filter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // e.g., /api/shared-schedules?id=abc123

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (id) {
      console.log('Fetching shared schedule with id:', id);

      const { data: sharedSchedule, error } = await supabase
        .from('SharedSchedule')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !sharedSchedule) {
        console.error('Shared schedule not found:', error);
        return NextResponse.json({ error: 'Shared schedule not found' }, { status: 404 });
      }

      return NextResponse.json({ sharedSchedule }, { status: 200 });
    }

    // If no `id` query param, return all shared schedules (or you can restrict this)
    console.log('Fetching all shared schedules');

    const { data: sharedSchedules, error } = await supabase
      .from('SharedSchedule')
      .select('*');

    if (error) {
      console.error('Error fetching shared schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch shared schedules' }, { status: 500 });
    }

    return NextResponse.json({ sharedSchedules }, { status: 200 });
  } catch (error) {
    console.error('API GET error:', error);
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
