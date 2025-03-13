import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    // Parse the request body
    const {
      type,
      title,
      description,
      startDateTime,
      endDateTime,
      isAllDay,
      repeat,
      userId,
    } = await request.json();

    // Validate required fields
    if (!type || !title || !startDateTime || !endDateTime || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save the event to the database
    const newEvent = await prisma.schedule.create({
      data: {
        type,
        title,
        description,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        isAllDay,
        repeat,
        status: 'CONFIRMED', // Default status
        userId, // Associate the event with the logged-in user
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}