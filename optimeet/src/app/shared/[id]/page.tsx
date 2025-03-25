"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "@/components/calendar";
import styles from "./SharedSchedules.module.css";
import EscaladeLoader from "@/components/EscaladeLoader";
import { supabase } from "@/lib/supabase";

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

interface ProposedTime {
  start: string;
  end: string;
}

export default function SharedSchedulesPage() {
  const params = useParams();
  const id = params?.id as string;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("month");
  const [user, setUser] = useState<User | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSenderId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error.message);
      setSenderId(user?.id || null);
    };
    fetchSenderId();
  }, []);

  useEffect(() => {
    const fetchSharedSchedules = async () => {
      try {
        if (!id) {
          setError("Invalid user ID.");
          return;
        }

        // Fetch schedules
        const response = await fetch(`/api/schedules-by-user-id?userId=${id}`);
        if (!response.ok) throw new Error("Failed to fetch schedules.");
        
        let { schedules } = await response.json();
        schedules = schedules.map((s: Schedule) => ({
          ...s,
          startDateTime: new Date(s.startDateTime + "Z"),
          endDateTime: new Date(s.endDateTime + "Z"),
        }));
        setSchedules(schedules);

        // Fetch user info
        const userResponse = await fetch(`/api/user-info?userId=${id}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user info.");
        
        const { user } = await userResponse.json();
        setUser(user);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchSharedSchedules();
  }, [id]);

  const handleCreateAppointmentRequest = async ({
    proposedTimes,
    selectedTime,
    message,
  }: {
    proposedTimes: ProposedTime[];
    selectedTime?: string;
    message?: string;
  }) => {
    if (!senderId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      // Convert to backend-compatible format
      const backendProposedTimes = proposedTimes.map(t => [t.start, t.end]);

      const response = await fetch("/api/appointment-requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          senderId,
          receiverId: id,
          proposedTimes: backendProposedTimes,
          selectedTime,
          message: message || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Request failed");
      }

      alert("Appointment request sent successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
          <h2>{`${user.name}'s Schedule`}</h2>
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