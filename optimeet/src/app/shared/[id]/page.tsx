"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./SharedSchedules.module.css"; // 📝 Ensure the filename matches your CSS file!

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
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading shared schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.headingPrimary}>Shared Schedules</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.headingPrimary}>Shared Schedules</h1>
      <p className={styles.paragraph}>These schedules were shared with you.</p>

      {schedules.length === 0 ? (
        <p className={styles.paragraph}>No shared schedules found.</p>
      ) : (
        <ul className={styles.scheduleList}>
          {schedules.map((schedule) => (
            <li key={schedule.id} className={styles.scheduleItem}>
              <h2 className={styles.headingSecondary}>{schedule.title}</h2>
              <p className={styles.paragraph}>{schedule.description}</p>
              <p className={styles.paragraph}>
                <strong>Start:</strong> {new Date(schedule.startDateTime).toLocaleString()}
              </p>
              <p className={styles.paragraph}>
                <strong>End:</strong> {new Date(schedule.endDateTime).toLocaleString()}
              </p>
              <p className={styles.paragraph}>
                <strong>All Day:</strong> {schedule.isAllDay ? "Yes" : "No"}
              </p>
              <p className={styles.paragraph}>
                <strong>Repeat:</strong> {schedule.repeat}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
