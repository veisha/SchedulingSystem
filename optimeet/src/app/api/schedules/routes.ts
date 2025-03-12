import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

enum ScheduleType {
  TASK = 'TASK',
  APPOINTMENT = 'APPOINTMENT',
  RESTDAY = 'RESTDAY',
  BLOCK = 'BLOCK',
}

// Define the type for the request body
interface ScheduleData {
  type: ScheduleType;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  repeat?: any; // Use a more specific type if possible
  userId: string;
}



export async function POST(request: Request) {
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
    }: ScheduleData = await request.json();

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
        type, // This should now match the ScheduleType enum
        title,
        description,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        isAllDay,
        repeat,
        status: 'CONFIRMED', // Default status
        userId, // This should now be a string
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}