import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Import the singleton Prisma client

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new user
export async function POST(request) {
  try {
    const { name, email, password, timeZone, avatar, preferences } = await request.json();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        timeZone,
        avatar,
        preferences,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}