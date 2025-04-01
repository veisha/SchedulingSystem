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
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  const updateDateTime = (dateTime: Date) => {
    setCurrentDateTime(dateTime);
  };

  const formatHeaderDisplay = () => {
    switch (calendarView) {
      case "day":
        return {
          day: currentDateTime.toLocaleDateString("en-US", { weekday: "long" }),
          year: currentDateTime.getFullYear().toString(),
          monthDay: currentDateTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      case "week": {
        const startOfWeek = new Date(currentDateTime);
        startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
      
        return {
          year: currentDateTime.getFullYear().toString(),
          dayRange: `${startOfWeek.toLocaleDateString("en-US", { weekday: "short" })} - ${endOfWeek.toLocaleDateString("en-US", { weekday: "short" })}`,
          monthDayRange: `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { day: "numeric" })}`
        };
      }
      case "month":
        return {
          year: currentDateTime.getFullYear().toString(),
          month: currentDateTime.toLocaleDateString("en-US", { month: "long" })
        };
      case "year":
        return { year: currentDateTime.getFullYear().toString() };
      default:
        return { full: currentDateTime.toLocaleString() };
    }
  };

  const formattedHeader = formatHeaderDisplay();

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

        const response = await fetch(`/api/schedules-by-user-id?userId=${id}`);
        if (!response.ok) throw new Error("Failed to fetch schedules.");
        
        let { schedules } = await response.json();
        schedules = schedules.map((s: Schedule) => ({
          ...s,
          startDateTime: new Date(s.startDateTime),
          endDateTime: new Date(s.endDateTime),
        }));
        setSchedules(schedules);

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
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerDisplay}>
          {/* Date Section */}
          <div className={styles.headerDateSection}>
            {calendarView === "day" ? (
              <div className={styles.dayFormattedDate}>
                <div className={styles.year}>{formattedHeader.year}</div>
                <div className={styles.day}>{formattedHeader.day}</div>
                <div className={styles.monthDay}>{formattedHeader.monthDay}</div>
              </div>
            ) : calendarView === "week" ? (
              <div className={`${styles.dayFormattedDate} ${styles.weekFormattedDate}`}>
                <div className={styles.year}>{formattedHeader.year}</div>
                <div className={styles.dayRange}>{formattedHeader.dayRange}</div>
                <div className={styles.monthDayRange}>{formattedHeader.monthDayRange}</div>
              </div>
            ) : calendarView === "month" ? (
              <div className={`${styles.dayFormattedDate} ${styles.monthFormattedDate}`}>
                <div className={styles.year}>{formattedHeader.year}</div>
                <div className={styles.monthName}>{formattedHeader.month}</div>
              </div>
            ) : calendarView === "year" ? (
              <div className={styles.yearFormattedDate}>
                <div className={styles.year}>{formattedHeader.year}</div>
              </div>
            ) : (
              <div>{formattedHeader.full}</div>
            )}
          </div>
  
          {/* User Info Section */}
          {user && (
            <div className={styles.headerUserInfo}>
              <h2 className={styles.userName}>{`${user.name}'s Schedule`}</h2>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          )}
        </div>
      </div>
  
      {/* Calendar Section */}
      <Calendar
        schedules={schedules}
        updateDateTime={updateDateTime}
        view={calendarView}
        setView={setCalendarView}
        isReadOnly={true}
        onCreateAppointmentRequest={handleCreateAppointmentRequest}
      />
    </div>
  );
}