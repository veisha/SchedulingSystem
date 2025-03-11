"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Dashboard.module.css"; // Updated CSS to match HTML version

export default function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const adjustButtonPosition = () => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    const button = buttonRef.current;

    if (sidebar && header && button) {
      const sidebarWidth = sidebar.offsetWidth;
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

  // Adjust on sidebar toggle
  useEffect(() => {
    adjustButtonPosition();
  }, [sidebarVisible]);

  // Adjust on window resize
  useEffect(() => {
    window.addEventListener("resize", adjustButtonPosition);
    adjustButtonPosition(); // Initial adjustment on load

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
      <div ref={headerRef} className={styles.header}>
        Header
        <button ref={buttonRef} onClick={handleToggleSidebar}>
          =
        </button>
      </div>

      <div
        ref={sidebarRef}
        className={`${styles.sidebar} ${!sidebarVisible ? styles.hidden : ""}`}
      >
        Sidebar
      </div>

      <div className={styles.content}>Content Area</div>
    </div>
  );
}
