"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

import Calendar from "@/components/calendar"; // import the calendar component

import styles from "./Dashboard.module.css"; // all styles go here

export default function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({
      callbackUrl: "/login",
    });
  };

  const adjustButtonPosition = () => {
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
  };

  const handleToggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    adjustButtonPosition();
  }, [sidebarVisible]);

  useEffect(() => {
    window.addEventListener("resize", adjustButtonPosition);
    adjustButtonPosition();

    return () => {
      window.removeEventListener("resize", adjustButtonPosition);
    };
  }, []);

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
              Welcome, {session?.user?.name || "?"}
            </p>
            {/* Optional Avatar */}
            {/* <img className={styles.sidebarAvatar} src={session?.user?.image || "/default-avatar.png"} alt="User Avatar" /> */}
          </div>

          {/* Navigation Section */}
          <nav className={styles.sidebarNavContainer}>
            <ul className={styles.sidebarNavList}>
              <li className={styles.sidebarNavItem}>
                <Link href="/dashboard" className={styles.sidebarNavLink}>
                  Dashboard
                </Link>
              </li>

              <li className={styles.sidebarNavItem}>
                <Link href="/meetings" className={styles.sidebarNavLink}>
                  My Meetings
                </Link>
              </li>

              <li className={styles.sidebarNavItem}>
                <Link href="/meetings/create" className={styles.sidebarNavLink}>
                  Create Meeting
                </Link>
              </li>

              <li className={styles.sidebarNavItem}>
                <Link href="/invitations" className={styles.sidebarNavLink}>
                  Invitations
                </Link>
              </li>

              <li className={styles.sidebarNavItem}>
                <Link href="/settings" className={styles.sidebarNavLink}>
                  Settings
                </Link>
              </li>
               {/* Add logout button as a list item */}
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
          {/* Render the calendar for Dashboard view */}
          <Calendar />
        </div>
    </div>


  );
}
