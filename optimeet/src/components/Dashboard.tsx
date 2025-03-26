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
import Image from "next/image"; // ✅ Import Image component
import { getUserById } from '@/lib/supabaseHelpers';

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
interface AppointmentRequest {
  id: string;
  senderId: string;
  receiverId: string;
  proposedTimes: string[][];
  selectedTime: string | null;
  status: string;
  message: string;
  createdAt: string;
  updatedAt: string;
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
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [senderEmails, setSenderEmails] = useState<{ [key: string]: string }>({});

  const fetchAppointments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("AppointmentRequest")
        .select("*")
        .eq("receiverId", user.id);

      if (error) {
        console.error("Error fetching appointments:", error);
        return;
      }

      setAppointments(data || []);

      const emailsMap: { [key: string]: string } = {};
      for (const appointment of data || []) {
        if (!emailsMap[appointment.senderId]) {
          const email = await getUserById(appointment.senderId);
          if (email) {
            emailsMap[appointment.senderId] = email;
          }
        }
      }

      setSenderEmails(emailsMap);

      // ✅ NEW: Show a notification for new pending invitations
      const pendingAppointments = data?.filter((app) => app.status === "PENDING");
      if (pendingAppointments.length > 0) {
        addNotification(`📩 You have ${pendingAppointments.length} new invitations!`);
      }
    } catch (error) {
      console.error("Error in fetchAppointments:", error);
    }
  }, [user]);

  // ✅ Fetch appointments when the user is authenticated
  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);



  // Function to add a notification
  const addNotification = (message: string) => {
    const id = Date.now().toString(); // Unique ID for each notification
    setNotifications((prev) => [...prev, { id, message }]);

    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (!user) return;
  
    const channel = supabase
      .channel("appointment-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "AppointmentRequest" }, (payload) => {
        if (payload.new.receiverId === user.id) {
          addNotification(`📩 New appointment request received!`);
          fetchAppointments(); // ✅ Refresh appointments when a new one is added
        }
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAppointments]);
  
  
  

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
      const currentTime = new Date();
  
      // ✅ Define Schedule type
      interface Schedule {
        id: string;
        type: string;
        title: string;
        userId: string;
        startDateTime: Date;
        endDateTime: Date;
        status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
        newStatus?: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; // ✅ Fix
      }
  
      // ✅ Process schedules
      const updatedSchedules: Schedule[] = fetchedSchedules.map((schedule: any) => {
        // Convert UTC dates to local Manila time
        const startDateTime = new Date(schedule.startDateTime);
        const endDateTime = new Date(schedule.endDateTime);
  
        let newStatus: "COMPLETED" | "IN_PROGRESS" | "UPCOMING" | "CANCELLED" =
          currentTime > endDateTime
            ? "COMPLETED"
            : currentTime >= startDateTime
            ? "IN_PROGRESS"
            : "UPCOMING";
  
        return {
          ...schedule,
          startDateTime,
          endDateTime,
          newStatus, // ✅ Add this for updating the backend
        };
      });
  
      setSchedules(updatedSchedules);
      console.log("✅ Schedules fetched, converted, & statuses updated:", updatedSchedules);
  
      // ✅ Identify schedules that need an update
      const schedulesToUpdate = updatedSchedules.filter(
        (schedule) => schedule.status !== schedule.newStatus // ✅ Compare old status vs new status
      );
  
      if (schedulesToUpdate.length > 0) {
        console.log("🔄 Updating statuses in Supabase:", schedulesToUpdate);
  
        // ✅ Get user auth token
        const { data: session } = await supabase.auth.getSession();
        const accessToken = session?.session?.access_token;
  
        if (!accessToken) {
          console.error("❌ No access token found. User may not be authenticated.");
          return;
        }
  
        // ✅ Send `newStatus` instead of `status`
        const updateResponse = await fetch("/api/update-schedules-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ schedules: schedulesToUpdate }), // ✅ Fix
        });
  
        if (!updateResponse.ok) {
          console.error("❌ Failed to update schedule statuses in Supabase");
        } else {
          console.log("✅ Schedule statuses successfully updated in Supabase");
        }
      }
    } catch (error) {
      console.error("Error fetching/updating schedules:", error);
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

      {/* Notifications */}
      <div className={styles.notificationsContainer}>
        {notifications.map((notif) => (
          <div key={notif.id} className={styles.notification}>
            {notif.message}
          </div>
        ))}
      </div>


      {/* Header */}
      <div ref={headerRef} className={styles.header}>
        <div>{formatHeaderDisplay()}</div>
      </div>


      {/* Sidebar */}
      {sidebarVisible && (
        <aside ref={sidebarRef} className={styles.sidebar}>
          <div className={styles.sidebarLogoContainer}>
            <Image src="/logo.png" alt="Optimeet Logo" className={styles.sidebarLogo} width={28} height={28} />
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
        fetchAppointments={fetchAppointments} 
        appointments={appointments} 
        senderEmails={senderEmails} 
        fetchSchedules={fetchSchedules} 
        schedules={schedules}
        />}
        {currentContent === "profile" && <div>Profile Content</div>}
        {currentContent === "settings" && <Settings />}
      </div>
    </div>
  );
}
