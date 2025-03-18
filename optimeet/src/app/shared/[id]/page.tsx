"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./SharedSchedules.module.css";

// Define the type for a schedule
interface Schedule {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  repeat: string;
}

export default function SharedSchedulesPage() {
  const params = useParams();
  const id = params?.id as string;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedSchedules = async () => {
      try {
        console.log("🔎 Fetching schedules by userId...");
        console.log("➡️ userId from URL:", id);

        if (!id) {
          console.warn("⚠️ No ID provided in URL params.");
          setError("Invalid user ID.");
          return;
        }

        // ✅ Call the updated API route
        const response = await fetch(`/api/schedules-by-user-id?userId=${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch schedules");
        }

        const { schedules }: { schedules: Schedule[] } = await response.json();

        console.log("✅ Schedules fetched:", schedules);

        setSchedules(schedules);
      } catch (error) {
        console.error("❗Fetch error:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSchedules();
  }, [id]);

  if (loading) {
    return <div>Loading shared schedules...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Shared Schedules</h1>
      <p>These schedules were shared with you.</p>

      {schedules.length === 0 ? (
        <p className={styles.noSchedules}>No shared schedules found.</p>
      ) : (
        <ul className={styles.scheduleList}>
          {schedules.map((schedule) => (
            <li key={schedule.id} className={styles.scheduleItem}>
              <h2>{schedule.title}</h2>
              <p>{schedule.description}</p>
              <p>Start: {new Date(schedule.startDateTime).toLocaleString()}</p>
              <p>End: {new Date(schedule.endDateTime).toLocaleString()}</p>
              <p>All Day: {schedule.isAllDay ? "Yes" : "No"}</p>
              <p>Repeat: {schedule.repeat}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
