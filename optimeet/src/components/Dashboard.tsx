"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase"; // Correct import path
import { User } from "@supabase/supabase-js"; // Import User type
import Calendar from "@/components/calendar"; // Import the calendar component
import MySchedules from "@/components/mySchedules"; // Import MySchedules component
import AddSchedule from "@/components/addSchedule"; // Import AddSchedule component
import Invitations from "@/components/invitations"; // Import Invitations component
import Settings from "@/components/settings"; // Import Settings component
import styles from "./Dashboard.module.css"; // All styles go here

export default function Dashboard() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Explicitly define the type
  const [currentContent, setCurrentContent] = useState<
    "calendar" | "mySchedules" | "addSchedule" | "invitations" | "settings"
  >("calendar");

  const sidebarRef = useRef<HTMLDivElement>(null); // Define type for sidebar
  const headerRef = useRef<HTMLDivElement>(null); // Define type for header
  const buttonRef = useRef<HTMLButtonElement>(null); // Define type for button
  const containerRef = useRef<HTMLDivElement>(null); // Define type for container

  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login"); // Redirect to login if no session
      } else {
        setUser(session.user); // Set user data
      }
    };

    checkSession();
  }, [router]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut(); // Sign out with Supabase
    router.push("/login"); // Redirect to login
  };

  // Adjust button position
  const adjustButtonPosition = useCallback(() => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    const button = buttonRef.current;

    if (sidebar && header && button) {
      const headerHeight = header.offsetHeight; // No more type error

      if (!sidebarVisible) {
        button.style.left = "0"; // No more type error
      } else {
        button.style.left = `${-10}px`; // No more type error
      }

      button.style.top = `${headerHeight / 2}px`; // No more type error
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

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${
        !sidebarVisible ? styles.hiddenSidebar : ""
      }`}
    >
      {/* Header */}
      <div ref={headerRef} className={styles.header}>
        Header
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
                  My Schedule
                </button>
              </li>

              <li className={styles.sidebarNavItem}>
                <button
                  onClick={() => setCurrentContent("addSchedule")}
                  className={styles.sidebarNavLink}
                >
                  Add Schedule
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
        {currentContent === "calendar" && <Calendar />}
        {currentContent === "mySchedules" && <MySchedules />}
        {currentContent === "addSchedule" && <AddSchedule />}
        {currentContent === "invitations" && <Invitations />}
        {currentContent === "settings" && <Settings />}
      </div>
    </div>
  );
}