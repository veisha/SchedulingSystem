import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Adjust the import path as needed

// GET all schedules
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: { user: true }, // Include related user data
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new schedule
export async function POST(request) {
  try {
    const { userId, type, title, description, startDateTime, endDateTime, isAllDay, repeat, status } =
      await request.json();

    const newSchedule = await prisma.schedule.create({
      data: {
        userId,
        type,
        title,
        description,
        startDateTime,
        endDateTime,
        isAllDay,
        repeat,
        status,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}