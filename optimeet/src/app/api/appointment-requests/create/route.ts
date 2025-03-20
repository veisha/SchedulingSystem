import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No JWT provided." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid JWT." },
        { status: 401 }
      );
    }

    const senderId = user.id;

    const body = await req.json();
    const { receiverId, proposedTimes, selectedTime, message } = body;

    const { data, error } = await supabase.from("AppointmentRequest").insert([
      {
        senderId,
        receiverId,
        proposedTimes,
        selectedTime: selectedTime || null,
        message: message || "",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error inserting appointment request:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Unhandled error:", err.message);
    } else {
      console.error("Unhandled error:", err);
    }

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
