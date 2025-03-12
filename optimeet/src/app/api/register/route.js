import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { name, email, password, timeZone } = await request.json();

    // Step 1: Register the user with Supabase
    const { error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          timeZone,
        },
      },
    });

    if (supabaseError) {
      throw supabaseError;
    }

    // Step 2: Create a corresponding user record in Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // Note: Store hashed passwords in production
        timeZone,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}