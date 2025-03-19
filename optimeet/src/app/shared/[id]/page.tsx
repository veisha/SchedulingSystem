"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "@/components/calendar";
import styles from "./SharedSchedules.module.css";
import EscaladeLoader from "@/components/EscaladeLoader"; // Adjust the path as needed

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
  const id = params?.id as string;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("month");

  // ✅ User data state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchSharedSchedules = async () => {
      try {
        console.log("🔎 Fetching schedules and user info by userId...");
        console.log("➡️ userId from URL:", id);
    
        if (!id) {
          console.warn("⚠️ No ID provided in URL params.");
          setError("Invalid user ID.");
          return;
        }
    
        // 🔥 1. Fetch schedules by userId
        const response = await fetch(`/api/schedules-by-user-id?userId=${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch schedules");
        }
    
        let { schedules }: { schedules: Schedule[] } = await response.json();
        console.log("✅ Schedules fetched (raw):", schedules);
    
        // ✅ Convert to local time
        schedules = schedules.map((schedule) => ({
          ...schedule,
          startDateTime: new Date(schedule.startDateTime + "Z"),
          endDateTime: new Date(schedule.endDateTime + "Z"),
        }));
    
        console.log("✅ Schedules after converting to local Date objects:", schedules);
    
        setSchedules(schedules);
    
        // 🔥 2. Fetch user info by userId
        const userResponse = await fetch(`/api/user-info?userId=${id}`);
        if (!userResponse.ok) {
          const userError = await userResponse.json();
          throw new Error(userError.error || "Failed to fetch user info");
        }
    
        const { user }: { user: User } = await userResponse.json();
        console.log("✅ User info fetched:", user);
    
        setUser(user);
      } catch (error) {
        console.error("❗Fetch error:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    

    fetchSharedSchedules(); // Removed the setTimeout and called directly
  }, [id]);

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
      {/* ✅ User Info Section */}
      {user && (
        <div className={styles.userInfo}>
          <h2>Shared by: {user.name}</h2>
          <p>Email: {user.email}</p>
        </div>
      )}

      {/* ✅ Calendar Component */}
      <Calendar
        schedules={schedules}
        updateDateTime={() => {}}
        view={calendarView}
        setView={setCalendarView}
        isReadOnly={true}
      />
    </div>
  );
}
