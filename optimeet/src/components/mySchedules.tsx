"use client";

import { useEffect, useState } from "react";
import styles from "./mySchedules.module.css";
import { supabase } from "@/lib/supabase"; // Adjust the path if needed

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
        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("User not authenticated");
        }

        // Fetch schedules for the authenticated user
        const response = await fetch(`/api/schedule?userId=${user.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch schedules");
        }

        const data: Schedule[] = await response.json();
        setSchedules(data);
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
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Directly create the link using the user ID
      const link = `${window.location.origin}/shared/${user.id}`;

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

      {/* Button to generate a shareable link */}
      <button onClick={generateShareableLink} className={styles.shareButton}>
        Generate Shareable Link
      </button>

      {/* Display the shareable link */}
      {shareableLink && (
        <div className={styles.shareableLink}>
          <p>Share this link:</p>
          <a href={shareableLink} target="_blank" rel="noopener noreferrer">
            {shareableLink}
          </a>
        </div>
      )}

      {/* Display the list of schedules or a "No schedules" message */}
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
