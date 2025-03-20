import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all users
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users') // Your Supabase table name
      .select('*');

    if (error) {
      console.error('Error fetching users:', error.message);
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new user
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, timeZone, avatar, preferences } = await request.json();

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password,
          timeZone,
          avatar,
          preferences,
        },
      ])
      .select() // optional: returns the newly created user
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
