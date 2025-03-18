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

export default function Dashboard() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentContent, setCurrentContent] = useState<
    "calendar" | "mySchedules" | "invitations" | "settings" | "profile"
  >("calendar");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("day");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check session on component mount
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

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Adjust button position
  const adjustButtonPosition = useCallback(() => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    const button = buttonRef.current;

    if (sidebar && header && button) {
      const headerHeight = header.offsetHeight;

      if (!sidebarVisible) {
        button.style.left = "0";
      } else {
        button.style.left = `${-10}px`;
      }

      button.style.top = `${headerHeight / 2}px`;
    }
  }, [sidebarVisible]);

  // Toggle sidebar visibility
  const handleToggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  // Adjust button position on sidebar toggle or window resize
  useEffect(() => {
    adjustButtonPosition();
  }, [sidebarVisible, adjustButtonPosition]);

  useEffect(() => {
    window.addEventListener("resize", adjustButtonPosition);
    adjustButtonPosition();

    return () => {
      window.removeEventListener("resize", adjustButtonPosition);
    };
  }, [adjustButtonPosition]);

  // Function to update current date and time
  const updateDateTime = (dateTime: Date) => {
    setCurrentDateTime(dateTime);
  };

  // Format the header display based on the calendar view
  const formatHeaderDisplay = () => {
    switch (calendarView) {
      case "day":
        return currentDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "week":
        const startOfWeek = new Date(currentDateTime);
        startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
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
      className={`${styles.container} ${
        !sidebarVisible ? styles.hiddenSidebar : ""
      }`}
    >
      {/* Header */}
      <div ref={headerRef} className={styles.header}>
        <div>{formatHeaderDisplay()}</div> {/* Display formatted date/time */}
        <button ref={buttonRef} onClick={handleToggleSidebar}>
          =
        </button>
      </div>

      {/* Sidebar */}
      {sidebarVisible && (
        <aside ref={sidebarRef} className={styles.sidebar}>
          {/* Logo Section */}
          <div className={styles.sidebarLogoContainer}>
            <h2 className={styles.sidebarLogoText}>Optimeet</h2>
          </div>

          {/* Profile Section */}
          <div className={styles.sidebarProfileContainer}>
            <p className={styles.sidebarWelcomeText}>
              Welcome, {user?.user_metadata?.name || user?.email || "?"}
            </p>
          </div>

          {/* Navigation Section */}
          <nav className={styles.sidebarNavContainer}>
            <ul className={styles.sidebarNavList}>
              {/* Profile Button */}
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("profile")}
                  className={styles.sidebarNavLink}
                >
                  Profile
                </button>
              </li>

              {/* Dashboard Button */}
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("calendar")}
                  className={styles.sidebarNavLink}
                >
                  Dashboard
                </button>
              </li>

              {/* My Schedules Button */}
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("mySchedules")}
                  className={styles.sidebarNavLink}
                >
                  My Schedules
                </button>
              </li>

              {/* Invitations Button */}
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("invitations")}
                  className={styles.sidebarNavLink}
                >
                  Invitations
                </button>
              </li>

              {/* Settings Button */}
              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("settings")}
                  className={styles.sidebarNavLink}
                >
                  Settings
                </button>
              </li>

              {/* Logout Button */}
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
            updateDateTime={updateDateTime}
            view={calendarView}
            setView={setCalendarView}
          />
        )}
        {currentContent === "mySchedules" && <MySchedules />}
        {currentContent === "invitations" && <Invitations />}
        {currentContent === "profile" && <div>Profile Content</div>}
        {currentContent === "settings" && <Settings />}
      </div>
    </div>
  );
}
