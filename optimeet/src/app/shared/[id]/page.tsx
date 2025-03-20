"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "@/components/calendar";
import styles from "./SharedSchedules.module.css";
import EscaladeLoader from "@/components/EscaladeLoader";
import { supabase } from "@/lib/supabase"; // ✅ Supabase Client

interface Schedule {
  id: string;
  type: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  isAllDay?: boolean;
  repeat?: string;
  status?: string;
  userId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function SharedSchedulesPage() {
  const params = useParams();
  const id = params?.id as string; // receiverId from URL param

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("month");

  const [user, setUser] = useState<User | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);

  // ✅ Get authenticated user for senderId
  useEffect(() => {
    const fetchSenderId = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("❗Error fetching authenticated user:", error.message);
        return;
      }

      console.log("✅ Authenticated user:", user);
      setSenderId(user?.id || null);
    };

    fetchSenderId();
  }, []);

  // ✅ Fetch shared schedules and user info
  useEffect(() => {
    const fetchSharedSchedules = async () => {
      try {
        console.log("🔎 Fetching schedules & user info for userId:", id);

        if (!id) {
          console.warn("⚠️ No ID found in URL params.");
          setError("Invalid user ID.");
          return;
        }

        // ✅ 1. Get schedules by userId
        const response = await fetch(`/api/schedules-by-user-id?userId=${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch schedules.");
        }

        let { schedules }: { schedules: Schedule[] } = await response.json();
        console.log("✅ Raw schedules fetched:", schedules);

        schedules = schedules.map((schedule) => ({
          ...schedule,
          startDateTime: new Date(schedule.startDateTime + "Z"),
          endDateTime: new Date(schedule.endDateTime + "Z"),
        }));

        console.log("✅ Processed schedules:", schedules);
        setSchedules(schedules);

        // ✅ 2. Get user info by userId
        const userResponse = await fetch(`/api/user-info?userId=${id}`);
        if (!userResponse.ok) {
          const userError = await userResponse.json();
          throw new Error(userError.error || "Failed to fetch user info.");
        }

        const { user }: { user: User } = await userResponse.json();
        console.log("✅ User info fetched:", user);

        setUser(user);
      } catch (error) {
        console.error("❗Fetch error:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSchedules();
  }, [id]);

  // ✅ Handle appointment request creation
  const handleCreateAppointmentRequest = async ({
    proposedTimes,
    selectedTime,
    message,
  }: {
    proposedTimes: string[];
    selectedTime?: string;
    message?: string;
  }) => {
    if (!senderId) {
      console.error("❗No authenticated user found. Cannot create request.");
      return;
    }
  
    // ✅ Get the user's JWT from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("❗No active session found.");
      return;
    }
  
    try {
      const response = await fetch("/api/appointment-requests/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // ✅ Include the JWT in the Authorization header
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          senderId,
          receiverId: id,
          proposedTimes,
          selectedTime: selectedTime || null,
          message: message || "",
        }),
      });
      console.log(response);
      // ... rest of the code ...
    } catch (error) {
      console.error("❗Error creating appointment request:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <EscaladeLoader />
        <p className={styles.loadtext}>Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {user && (
        <div className={styles.userInfo}>
          <h2>Shared by: {user.name}</h2>
          <p>Email: {user.email}</p>
        </div>
      )}

      <Calendar
        schedules={schedules}
        updateDateTime={() => {}}
        view={calendarView}
        setView={setCalendarView}
        isReadOnly={true}
        onCreateAppointmentRequest={handleCreateAppointmentRequest}
      />
    </div>
  );
}