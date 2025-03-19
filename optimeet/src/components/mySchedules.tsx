"use client";

import { useEffect, useState } from "react";
import styles from "./mySchedules.module.css";
import { supabase } from "@/lib/supabase";

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

export default function MySchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("User not authenticated");
        }

        console.log("✅ Authenticated user:", user.id);

        const response = await fetch(`/api/schedules-by-user-id?userId=${user.id}`);

        if (!response.ok) {
          const { error: apiError } = await response.json();
          console.error("❗ API error:", apiError);
          throw new Error(apiError || "Failed to fetch schedules");
        }

        const { schedules } = await response.json();

        console.log("✅ Schedules fetched:", schedules);

        setSchedules(schedules);
      } catch (error) {
        console.error("❗ Fetch error:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const generateShareableLink = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const link = `${window.location.origin}/shared/${user.id}`;

      console.log("🔗 Shareable link generated:", link);

      setShareableLink(link);
    } catch (error) {
      console.error("❗ Link generation error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  if (loading) {
    return <div>Loading your schedules...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>My Schedules</h1>
      <p>This is where your schedules will be displayed.</p>

      <button onClick={generateShareableLink} className={styles.shareButton}>
        Generate Shareable Link
      </button>

      {shareableLink && (
        <div className={styles.shareableLink}>
          <p>Share this link:</p>
          <a href={shareableLink} target="_blank" rel="noopener noreferrer">
            {shareableLink}
          </a>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className={styles.noSchedules}>No schedules found. Create your first schedule!</p>
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
