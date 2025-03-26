import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    console.log("🔑 Incoming Bearer token:", token);

    if (!token) {
      return NextResponse.json({ error: "No access token provided" }, { status: 401 });
    }

    // ✅ Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // ✅ Get authenticated user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("❌ Failed to get user:", userError);
      return NextResponse.json({ error: "Failed to authenticate user" }, { status: 401 });
    }

    console.log("🟢 Authenticated user:", user);

    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      console.error("❌ Invalid request body:", body);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // ✅ Filter schedules to update only those that belong to the authenticated user
    const updates = schedules
      .filter((schedule) => schedule.userId === user.user.id)
      .map((schedule) => ({
        id: schedule.id,
        status: schedule.newStatus,
      }));

    console.log("🔄 Updating schedules in Supabase:", updates);

    if (updates.length === 0) {
      return NextResponse.json({ message: "No schedules to update for this user" }, { status: 200 });
    }

    // ✅ Use `.update()` instead of `.upsert()` to avoid RLS errors
    const { data, error } = await supabase
      .from("Schedule")
      .update({ status: updates[0].status }) // ✅ Update only status
      .in("id", updates.map((s) => s.id)); // ✅ Filter by IDs

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Supabase update successful:", data);
    return NextResponse.json({ message: "Schedules updated successfully", data });

  } catch (error) {
    console.error("❌ Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
