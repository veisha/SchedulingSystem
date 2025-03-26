"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import styles from "./mySchedules.module.css";
import { supabase } from "@/lib/supabase";

interface Schedule {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  repeat: string;
  status: "COMPLETED" | "UPCOMING" | "CANCELED" | "IN_PROGRESS";
  type: string; // Add this line
}

const ITEMS_PER_PAGE = 5;

export default function MySchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const topRef = useRef<HTMLDivElement | null>(null);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("User not authenticated");

        const response = await fetch(`/api/schedules-by-user-id?userId=${user.id}`);
        if (!response.ok) {
          const { error: apiError } = await response.json();
          throw new Error(apiError || "Failed to fetch schedules");
        }

        let { schedules } = await response.json();
        setSchedules(schedules);
      } catch (error) {
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

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.startDateTime).getTime();
    const dateB = new Date(b.startDateTime).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(sortedSchedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = sortedSchedules.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={styles.container} ref={topRef}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Schedules</h1>
        <div className={styles.buttonContainer}>
          <button onClick={generateShareableLink} className={styles.shareButton}>
            Generate Shareable Link
          </button>
          <button onClick={toggleSortOrder} className={styles.sortButton}>
            <Image src="/sort.png" alt="Sort" width={24} height={24} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingMessage}>Loading your schedules...</p>
      ) : error ? (
        <p className={styles.errorMessage}>Error: {error}</p>
      ) : (
        <>
          {shareableLink && (
            <div className={styles.shareableLink}>
              <p className={styles.paragraph}>Share this link:</p>
              <a href={shareableLink} target="_blank" rel="noopener noreferrer">
                {shareableLink}
              </a>
            </div>
          )}

          {schedules.length === 0 ? (
            <p className={styles.noSchedules}>No schedules found. Create your first schedule!</p>
          ) : (
            <>
              <ul className={styles.scheduleList}>
                {paginatedSchedules.map((schedule) => (
                  <li key={schedule.id} className={styles.scheduleItem}>
                  {/* Status Badge */}
                  <span className={`${styles.statusBadge} ${styles[`status-${schedule.status.toLowerCase()}`]}`}>
                    {schedule.status.replace("_", " ")}
                  </span>
                  
                  {/* Schedule Details */}
                    <h2 className={styles.scheduleTitle}>{schedule.title}</h2>
                    <p className={styles.scheduleType}>{schedule.type}</p> {/* Add this line */}
                    <p className={styles.scheduleText}>{schedule.description}</p>


                  <p className={styles.scheduleText}>
                    <strong>Start:</strong> {new Date(schedule.startDateTime).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                  </p>
                  <p className={styles.scheduleText}>
                    <strong>End:</strong> {new Date(schedule.endDateTime).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                  </p>

                  <p className={styles.scheduleText}>
                    <strong>All Day:</strong> {schedule.isAllDay ? "Yes" : "No"}
                  </p>
                  <p className={styles.scheduleText}>
                    <strong>Repeat:</strong> {schedule.repeat}
                  </p>
                </li>                
                
                ))}
              </ul>

              <div className={styles.pagination}>
                <button 
                  className={styles.pageButton} 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>

                <button 
                  className={styles.pageButton} 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
