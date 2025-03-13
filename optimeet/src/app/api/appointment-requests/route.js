import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Adjust the import path as needed

// GET all appointment requests
export async function GET() {
  try {
    const appointmentRequests = await prisma.appointmentRequest.findMany({
      include: { sender: true, receiver: true }, // Include related user data
    });
    return NextResponse.json(appointmentRequests);
  } catch (error) {
    console.error('Error fetching appointment requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new appointment request
export async function POST(request) {
  try {
    const { senderId, receiverId, proposedTimes, selectedTime, status, message } =
      await request.json();

    const newAppointmentRequest = await prisma.appointmentRequest.create({
      data: {
        senderId,
        receiverId,
        proposedTimes,
        selectedTime,
        status,
        message,
      },
    });

    return NextResponse.json(newAppointmentRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}