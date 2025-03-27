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
import Image from "next/image";
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

  // Removed unused sidebarVisible state.
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentContent, setCurrentContent] = useState<"calendar" | "mySchedules" | "invitations" | "settings" | "profile">("calendar");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "year">("day");
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // Removed unused buttonRef.
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

      const pendingAppointments = data?.filter((app) => app.status === "PENDING");
      if (pendingAppointments && pendingAppointments.length > 0) {
        addNotification(`📩 You have ${pendingAppointments.length} new invitations!`);
      }
    } catch (error) {
      console.error("Error in fetchAppointments:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  // Function to add a notification
  const addNotification = (message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message }]);

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
          fetchAppointments();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAppointments]);

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

  
      interface FetchedSchedule {
        id: string;
        type: string;
        title: string;
        userId: string;
        startDateTime: string;
        endDateTime: string;
        status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
        description?: string;
      }
  
      // Map schedules while capturing the original status.
      const updatedSchedules: (Schedule & { originalStatus: FetchedSchedule["status"] })[] =
        fetchedSchedules.map((schedule: FetchedSchedule) => {
          const startDateTime = new Date(schedule.startDateTime);
          const endDateTime = new Date(schedule.endDateTime);
  
          const originalStatus = schedule.status;
          const newStatus: "COMPLETED" | "IN_PROGRESS" | "UPCOMING" =
          currentTime > endDateTime
              ? "COMPLETED"
              : currentTime >= startDateTime
              ? "IN_PROGRESS"
              : "UPCOMING";
  
          if (originalStatus !== newStatus) {
            console.log(
              `Schedule ${schedule.id} status changing from ${originalStatus} to ${newStatus}`
            );
          }
  
          return {
            ...schedule,
            startDateTime,
            endDateTime,
            status: newStatus,
            originalStatus,
          };
        });
  
      setSchedules(updatedSchedules);
      console.log("✅ Schedules fetched, converted, & statuses updated:", updatedSchedules);
  
      // Filter out only schedules where the original status is different from the new status.
      const schedulesToUpdate = updatedSchedules.filter(
        (schedule) => schedule.originalStatus !== schedule.status
      );
  
      if (schedulesToUpdate.length > 0) {
        console.log("🔄 Updating statuses in Supabase for schedules:", schedulesToUpdate);
  
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
  
        if (!accessToken) {
          console.error("❌ No access token found. User may not be authenticated.");
          return;
        }
  
        const updateResponse = await fetch("/api/update-schedules-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            schedules: schedulesToUpdate.map(({ id, status }) => ({ id, status })),
          }),
        });
  
        if (!updateResponse.ok) {
          console.error("❌ Failed to update schedule statuses in Supabase");
        } else {
          console.log("✅ Schedule statuses successfully updated in Supabase");
        }
      } else {
        console.log("No schedule statuses needed updating.");
      }
    } catch (error) {
      console.error("Error fetching/updating schedules:", error);
    }
  }, [user]);
  
  

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user, fetchSchedules]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const updateDateTime = (dateTime: Date) => {
    setCurrentDateTime(dateTime);
  };

  const formatHeaderDisplay = () => {
    switch (calendarView) {
      case "day":
        return {
          day: currentDateTime.toLocaleDateString("en-US", { weekday: "long" }),
          year: currentDateTime.getFullYear().toString(),
          monthDay: currentDateTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      case "week": {
        const startOfWeek = new Date(currentDateTime);
        startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
  
        return {
          year: currentDateTime.getFullYear().toString(),
          dayRange: `${startOfWeek.toLocaleDateString("en-US", { weekday: "short" })} - ${endOfWeek.toLocaleDateString("en-US", { weekday: "short" })}`,
          monthDayRange: `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { day: "numeric" })}`
        };
      }
      case "month":
        return {
          year: currentDateTime.getFullYear().toString(),
          month: currentDateTime.toLocaleDateString("en-US", { month: "long" })
        };
      case "year":
        return {
          year: currentDateTime.getFullYear().toString()
        };
      default:
        return { full: currentDateTime.toLocaleString() };
    }
  };
  
  const formattedHeader = formatHeaderDisplay(); // Ensure it returns an object

  return (
    <div ref={containerRef} className={`${styles.container}`}>
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
        <div className={styles.headerDisplay}>
          {calendarView === "day" ? (
            <div className={`${styles.dayFormattedDate}`}>
              <div className={styles.year}>{formattedHeader.year}</div>
              <div className={styles.day}>{formattedHeader.day}</div>
              <div className={styles.monthDay}>{formattedHeader.monthDay}</div>
            </div>
          ) : calendarView === "week" ? (
            <div className={`${styles.dayFormattedDate} ${styles.weekFormattedDate}`}>
              <div className={styles.year}>{formattedHeader.year}</div>
              <div className={styles.dayRange}>{formattedHeader.dayRange}</div>
              <div className={styles.monthDayRange}>{formattedHeader.monthDayRange}</div>
            </div>
          ) : calendarView === "month" ? (
            <div className={`${styles.dayFormattedDate} ${styles.monthFormattedDate}`}>
              <div className={styles.year}>{formattedHeader.year}</div>
              <div className={styles.monthName}>{formattedHeader.month}</div>
            </div>
          ) : calendarView === "year" ? (
            <div className={styles.yearFormattedDate}>
              <div className={styles.year}>{formattedHeader.year}</div>
            </div>
          ) : (
            <div>{formattedHeader.full}</div>
          )}
        </div>
      </div>
      {/* Sidebar */}
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
              <button onClick={() => setCurrentContent("profile")} className={styles.sidebarNavLink}>
                Profile
              </button>
            </li>
            <li className={styles.sidebarNavItem}>
              <button onClick={() => setCurrentContent("calendar")} className={styles.sidebarNavLink}>
                Dashboard
              </button>
            </li>
            <li className={styles.sidebarNavItem}>
              <button onClick={() => setCurrentContent("mySchedules")} className={styles.sidebarNavLink}>
                My Schedules
              </button>
            </li>
            <li className={styles.sidebarNavItem}>
              <button onClick={() => setCurrentContent("invitations")} className={styles.sidebarNavLink}>
                Invitations
              </button>
            </li>
            <li className={styles.sidebarNavItem}>
              <button onClick={() => setCurrentContent("settings")} className={styles.sidebarNavLink}>
                Settings
              </button>
            </li>
            <li className={styles.sidebarNavItem}>
              <button onClick={handleLogout} className={styles.sidebarLogoutButton}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

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
        {currentContent === "invitations" && (
          <Invitations
            fetchAppointments={fetchAppointments}
            appointments={appointments}
            senderEmails={senderEmails}
            fetchSchedules={fetchSchedules}
            schedules={schedules}
          />
        )}
        {currentContent === "profile" && <div>Profile Content</div>}
        {currentContent === "settings" && <Settings />}
      </div>
    </div>
  );
}
