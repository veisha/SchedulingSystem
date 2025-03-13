import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Create a new schedule
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

// GET: Fetch all schedules (optionally filter by user)
export async function GET(request) {
  try {
    // If you want to filter by userId in query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const whereClause = userId ? { userId } : {};

    // Fetch schedules from the database
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      orderBy: {
        startDateTime: 'asc', // Optional: sort by start date
      },
    });

    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
