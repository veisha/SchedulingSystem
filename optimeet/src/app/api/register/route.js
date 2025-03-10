import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    // 👇 Receive the JSON data from the request body
    const { name, email, password, timeZone } = await req.json();

    // ✅ Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create a new user in the database, including the timeZone
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        timeZone, // ← timeZone goes here!
      },
    });

    // ✅ Return a success message and the created user (you can exclude password from response if you want)
    return NextResponse.json({ message: 'User registered successfully!', user });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
