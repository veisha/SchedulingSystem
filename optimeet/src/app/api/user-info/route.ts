import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Correct table casing. Supabase is case-sensitive if your table is named "User".
  const { data, error } = await supabase
    .from("User") // <- Confirm this matches your Supabase table name!
    .select("id, email, name")
    .eq("id", userId)
    .maybeSingle(); // 👈 ensures we only ever get 0 or 1 record (avoids the need for array logic)

  if (error) {
    console.error("❗ Supabase query error:", error.message);
    return NextResponse.json({ error: "Failed to query user", details: error.message }, { status: 500 });
  }

  if (!data) {
    console.warn("⚠️ No user found with userId:", userId);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: data });
}
