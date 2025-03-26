import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    console.log('🔑 Incoming Bearer token:', token);

    if (!token) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const body = await request.json();

    console.log('Received POST body:', body);

    const {
      type,
      title,
      description,
      startDateTime,
      endDateTime,
      isAllDay,
      repeat,
      userId,
    } = body;

    if (!type || !title || !startDateTime || !endDateTime || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Schedule')
      .insert([
        {
          type,
          title,
          description,
          startDateTime,
          endDateTime,
          isAllDay,
          repeat,
          status: 'UPCOMING',
          userId,
        },
      ])
      .select();

    console.log('🟢 Supabase insert data:', data);
    console.log('🔴 Supabase insert error:', error);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
