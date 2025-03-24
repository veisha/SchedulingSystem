"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Calendar from "@/components/calendar";
import MySchedules from "@/components/mySchedules";
import Invitations from "@/components/invitations";
import Settings from "@/components/settings";
import styles from "./Dashboard.module.css";

// Define Schedule interface (adjust if you have this globally)
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

export default function Dashboard() {
  const router = useRouter();

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentContent, setCurrentContent] = useState<
    "calendar" | "mySchedules" | "invitations" | "settings" | "profile"
  >("calendar");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("day");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Get the authenticated user on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    };

    checkSession();
  }, [router]);

  // ✅ Fetch schedules after user is authenticated
  // ✅ Fetch schedules function that can be reused
  const fetchSchedules = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/schedules-by-user-id?userId=${user.id}`);
      if (!response.ok) {
        console.error("Failed to fetch schedules");
        return;
      }

      const { schedules: fetchedSchedules } = await response.json();

      // ✅ Convert date strings to Date objects and adjust for local timezone
      const convertedSchedules = fetchedSchedules.map((schedule: Schedule) => {
        const startDateTime = new Date(schedule.startDateTime + "Z");
        const endDateTime = new Date(schedule.endDateTime + "Z");

        return {
          ...schedule,
          startDateTime,
          endDateTime,
        };
      });

      setSchedules(convertedSchedules);
      console.log("✅ Schedules fetched & converted:", convertedSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  }, [user]);

  // ✅ Fetch schedules after user is authenticated
  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user, fetchSchedules]);
  

  // ✅ Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ✅ Sidebar toggle button positioning
  const adjustButtonPosition = useCallback(() => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    const button = buttonRef.current;

    if (sidebar && header && button) {
      const headerHeight = header.offsetHeight;

      button.style.left = !sidebarVisible ? "0" : `${-10}px`;
      button.style.top = `${headerHeight / 2}px`;
    }
  }, [sidebarVisible]);

  // ✅ Toggle sidebar visibility
  const handleToggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  // ✅ Adjust button on sidebar toggle
  useEffect(() => {
    adjustButtonPosition();
  }, [sidebarVisible, adjustButtonPosition]);

  // ✅ Window resize handler
  useEffect(() => {
    window.addEventListener("resize", adjustButtonPosition);
    adjustButtonPosition();

    return () => {
      window.removeEventListener("resize", adjustButtonPosition);
    };
  }, [adjustButtonPosition]);

  // ✅ DateTime update
  const updateDateTime = (dateTime: Date) => {
    setCurrentDateTime(dateTime);
  };

  // ✅ Format the header display
  const formatHeaderDisplay = () => {
    switch (calendarView) {
      case "day":
        return currentDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "week": {
        const startOfWeek = new Date(currentDateTime);
        startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
      }
      case "month":
        return currentDateTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "year":
        return currentDateTime.toLocaleDateString("en-US", {
          year: "numeric",
        });
      default:
        return currentDateTime.toLocaleString();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${!sidebarVisible ? styles.hiddenSidebar : ""}`}
    >
      {/* Header */}
      <div ref={headerRef} className={styles.header}>
        <div>{formatHeaderDisplay()}</div>
        <button ref={buttonRef} onClick={handleToggleSidebar}>
          =
        </button>
      </div>

      {/* Sidebar */}
      {sidebarVisible && (
        <aside ref={sidebarRef} className={styles.sidebar}>
          <div className={styles.sidebarLogoContainer}>
            <h2 className={styles.sidebarLogoText}>Optimeet</h2>
          </div>

          <div className={styles.sidebarProfileContainer}>
            <p className={styles.sidebarWelcomeText}>
              Welcome, {user?.user_metadata?.name || user?.email || "?"}
            </p>
          </div>

          <nav className={styles.sidebarNavContainer}>
            <ul className={styles.sidebarNavList}>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("profile")}
                  className={styles.sidebarNavLink}
                >
                  Profile
                </button>
              </li>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("calendar")}
                  className={styles.sidebarNavLink}
                >
                  Dashboard
                </button>
              </li>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("mySchedules")}
                  className={styles.sidebarNavLink}
                >
                  My Schedules
                </button>
              </li>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("invitations")}
                  className={styles.sidebarNavLink}
                >
                  Invitations
                </button>
              </li>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("settings")}
                  className={styles.sidebarNavLink}
                >
                  Settings
                </button>
              </li>
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={handleLogout}
                  className={styles.sidebarLogoutButton}
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>
      )}

      {/* Content Area */}
      <div className={styles.content}>
        {currentContent === "calendar" && (
          <Calendar
          schedules={schedules}
          setSchedules={setSchedules}
          fetchSchedules={fetchSchedules}
          updateDateTime={updateDateTime}
          view={calendarView}
          setView={setCalendarView}
          isReadOnly={false}
        />
        )}
        {currentContent === "mySchedules" && <MySchedules />}
        {currentContent === "invitations" && 
        <Invitations 
        fetchSchedules={fetchSchedules} 
        schedules={schedules}
        />}
        {currentContent === "profile" && <div>Profile Content</div>}
        {currentContent === "settings" && <Settings />}
      </div>
    </div>
  );
}
