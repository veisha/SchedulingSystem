"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./Calendar.module.css";
import { supabase } from '@/lib/supabase'; // Adjust the import based on your project structure


type CalendarView = "day" | "week" | "month" | "year";

enum ScheduleType {
  TASK = "TASK",
  APPOINTMENT = "APPOINTMENT",
  RESTDAY = "RESTDAY",
  BLOCK = "BLOCK",
}

interface RepeatType {
  frequency: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
}

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

interface FormData {
  type: ScheduleType;
  title: string;
  description: string;
  isAllDay: boolean;
  repeat: RepeatType | null;
}

interface CalendarProps {
  updateDateTime: (dateTime: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  schedules: Schedule[];
  isReadOnly?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  updateDateTime,
  view,
  setView,
  schedules,
  isReadOnly = false,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [, setDays] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; endDate: Date } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    type: ScheduleType.TASK,
    title: "",
    description: "",
    isAllDay: false,
    repeat: null,
  });

  // Notify the parent component of date changes
  useEffect(() => {
    updateDateTime(currentDate);
  }, [currentDate, updateDateTime]);

  // For Month view: Generate all the days of the current month.
  useEffect(() => {
    if (view === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const daysArray: Date[] = [];
      for (let d = 1; d <= lastDay.getDate(); d++) {
        daysArray.push(new Date(year, month, d));
      }
      setDays(daysArray);
    } else {
      setDays([]);
    }
  }, [currentDate, view]);

  // Navigate to the previous day
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to the next day
  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Get the current hour for highlighting
  const getCurrentHour = () => {
    const now = new Date();
    if (
      now.getDate() === currentDate.getDate() &&
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear()
    ) {
      return now.getHours();
    }
    return -1; // No highlight if it's not the current day
  };

  // ✅ Handle adding a new schedule

  const handleAddSchedule = async ({
    formData,
    selectedSlot,
    closePopover,
  }: {
    formData: FormData;
    selectedSlot: { date: Date; hour: number; endDate: Date } | null;
    closePopover: () => void;
  }) => {
    if (isReadOnly) return; // Disable schedule creation in read-only mode
  
    if (!selectedSlot) {
      alert("No time slot selected!");
      return;
    }
  
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      alert("You must be logged in to add a schedule.");
      return;
    }
  
    const userId = user.id;
  
    // ✅ No UTC conversion, use local dates directly
    const startDateTime = selectedSlot.date;      // Local date-time
    const endDateTime = selectedSlot.endDate;     // Local date-time
  
    // ✅ Conflict checker (still works fine with local dates)
    const hasConflict = schedules.some((existing) => {
      const existingStart = new Date(existing.startDateTime).getTime();
      const existingEnd = new Date(existing.endDateTime).getTime();
  
      return startDateTime.getTime() < existingEnd && endDateTime.getTime() > existingStart;
    });
  
    if (hasConflict) {
      alert("There's a conflict with another schedule! Please select a different time.");
      return;
    }
  
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          // ✅ No .toISOString(), send the date directly or format as needed
          startDateTime: startDateTime.toString(),  // Or .toLocaleString() if needed
          endDateTime: endDateTime.toString(),      // Or .toLocaleString() if needed
          isAllDay: formData.isAllDay || false,
          repeat: formData.repeat || 'None',
          userId,
        }),
      });
  
      if (response.ok) {
        alert("Schedule added successfully!");
        closePopover();
      } else {
        alert("Failed to add schedule!");
      }
    } catch (error) {
      console.error("Error adding schedule:", error);
      alert("An error occurred while adding the schedule.");
    }
  };
  

  // Render the appropriate view based on the `view` state
  const renderView = () => {
    switch (view) {
      case "day":
        return renderDayView({
          handleAddSchedule: isReadOnly ? () => {} : handleAddSchedule,
          currentDate,
          selectedSlot,
          setSelectedSlot,
          formData: isReadOnly ? { type: ScheduleType.TASK, title: "", description: "", isAllDay: false, repeat: null } : formData,
          setFormData: isReadOnly ? () => {} : setFormData,
          goToPreviousDay,
          goToNextDay,
          getCurrentHour,
          schedules,
          setView,
        });
      case "week":
        return renderWeekView({
          currentDate,
          setCurrentDate,
          selectedSlot,
          setSelectedSlot,
          formData: isReadOnly ? { type: ScheduleType.TASK, title: "", description: "", isAllDay: false, repeat: null } : formData,
          setFormData: isReadOnly ? () => {} : setFormData,
          schedules,
          setView,
        });
      case "month":
        return renderMonthView({
          currentDate,
          setCurrentDate,
          setView,
        });
      case "year":
        return renderYearView({
          currentDate,
          setCurrentDate,
          setView,
        });
      default:
        return null;
    }
  };

  return (
    <div className={styles.calendarContainer}>
      {/* Calendar View */}
      <div className={styles.viewContent}>
        {renderView()}
      </div>
    </div>
  );
};

const renderDayView = ({
  handleAddSchedule,
  currentDate,
  selectedSlot,
  setSelectedSlot,
  formData,
  setFormData,
  goToPreviousDay,
  goToNextDay,
  getCurrentHour,
  schedules,
  setView,
}: {
  handleAddSchedule: ({
    formData,
    selectedSlot,
    closePopover,
  }: {
    formData: FormData;
    selectedSlot: { date: Date; hour: number; endDate: Date } | null;
    closePopover: () => void;
  }) => void;
  currentDate: Date;
  selectedSlot: { date: Date; hour: number; endDate: Date } | null;
  setSelectedSlot: (slot: { date: Date; hour: number; endDate: Date } | null) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  getCurrentHour: () => number;
  schedules: Schedule[];
  setView: (view: CalendarView) => void;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = getCurrentHour();

  const currentDay = currentDate.toLocaleString("default", { weekday: "long" });
  const currentDateFormatted = currentDate.toLocaleString("default", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter schedules for the current day
  const schedulesForTheDay = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.startDateTime);
    return (
      scheduleDate.getDate() === currentDate.getDate() &&
      scheduleDate.getMonth() === currentDate.getMonth() &&
      scheduleDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Debugging: Log schedules for the current day
  console.log("Schedules for the day:", schedulesForTheDay);

  const handleEventSlotClick = (hour: number) => {
    const selectedDate = new Date(currentDate);
    selectedDate.setHours(hour, 0, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    setSelectedSlot({ date: selectedDate, hour, endDate });
    console.log("Selected slot:", selectedDate);
  };

  const closePopover = () => {
    setSelectedSlot(null);
  };

  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    newEndDate.setMinutes(0, 0);

    if (!selectedSlot) return;

    setSelectedSlot({
      ...selectedSlot,
      endDate: newEndDate,
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleAddSchedule({ formData, selectedSlot, closePopover });
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:00`;
  };

  // Function to check if a time slot is in the past
  const isPastTimeSlot = (hour: number) => {
    const now = new Date();
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  // Function to check if a time slot is occupied
  const isOccupiedTimeSlot = (hour: number) => {
    return schedulesForTheDay.some((schedule) => {
      const startHour = new Date(schedule.startDateTime).getHours();
      const endHour = new Date(schedule.endDateTime).getHours();

      // Check if the current hour falls within the schedule's time range
      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <div className={styles.dayView}>
      {/* Header for Day View */}
      <div className={styles.dayViewHeader}>
        {/* Navigation Buttons (Left Side) */}
        <div className={styles.navigationButtons}>
          <button onClick={goToPreviousDay}>
          <Image
              src="/back.png"
              alt="Previous Day"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
          </button>
          <button onClick={goToNextDay}>
          <Image
              src="/next.png"
              alt="Next Day"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
          </button>
        </div>

        {/* Day and Date (Centered) */}
        <div>
          <h2>{currentDay}</h2>
          <p>{currentDateFormatted}</p>
        </div>

        {/* Dropdown for View Selection (Right Side) */}
        <div className={styles.viewSelector}>
          <select
            className={styles.viewDropdown}
            value="day" // Set the value to "day" since this is the day view
            onChange={(e) => setView(e.target.value as CalendarView)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Main view */}
      <div className={styles.dayViewColumns}>
        {/* Time Column */}
        <div className={styles.timeColumn}>
          {hours.map((hour) => (
            <div
              key={hour}
              className={`${styles.timeSlot} ${hour === currentHour ? styles.currentTime : ""}`}
            >
              {new Date(0, 0, 0, hour).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ))}
        </div>

        {/* Events Column */}
        <div className={styles.eventsColumn}>
          {hours.map((hour) => {
            const isOccupied = isOccupiedTimeSlot(hour); // Check if the time slot is occupied
            const isSelected = selectedSlot && selectedSlot.hour === hour;
            const isPast = isPastTimeSlot(hour); // Check if the time slot is in the past

            return (
              <div
                key={hour}
                onClick={!isPast && !isOccupied ? () => handleEventSlotClick(hour) : undefined} // Disable click for past and occupied slots
                className={`
                  ${styles.eventSlot}
                  ${hour === currentHour ? styles.currentTime : ""}
                  ${isOccupied ? styles.occupiedSlot : ""}
                  ${isSelected ? styles.selectedSlot : ""}
                  ${isPast ? styles.pastSlot : ""} // Apply a different style for past slots
                `}
                style={{ cursor: isPast || isOccupied ? "not-allowed" : "pointer" }} // Change cursor for past and occupied slots
              >
                {/* You can show an event title or icon here */}
                {isOccupied && <span className={styles.eventLabel}>Scheduled</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover */}
      {selectedSlot && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
            <h3>Add Schedule</h3>
            <form onSubmit={handleFormSubmit}>
              <label>
                Type:
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ScheduleType })
                  }
                  required
                >
                  <option value={ScheduleType.TASK}>Task</option>
                  <option value={ScheduleType.APPOINTMENT}>Appointment</option>
                  <option value={ScheduleType.RESTDAY}>Rest Day</option>
                  <option value={ScheduleType.BLOCK}>Block</option>
                </select>
              </label>

              <label>
                Title:
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Description:
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </label>

              <label>
                Start Date:
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formatDateTimeLocal(selectedSlot.date)}
                  disabled
                />
              </label>

              <label>
                End Date:
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formatDateTimeLocal(selectedSlot.endDate)}
                  onChange={handleEndDateTimeChange}
                  step="3600"
                />
              </label>

              <label>
                All Day:
                <input
                  type="checkbox"
                  name="isAllDay"
                  checked={formData.isAllDay}
                  onChange={(e) =>
                    setFormData({ ...formData, isAllDay: e.target.checked })
                  }
                />
              </label>

              <label>
                Repeat:
                <select
                  name="repeat"
                  value={formData.repeat ? formData.repeat.frequency : "NONE"}
                  onChange={(e) => {
                    const value = e.target.value as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
                    setFormData({
                      ...formData,
                      repeat: value !== "NONE" ? { frequency: value } : null,
                    });
                  }}
                >
                  <option value="NONE">None</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>

              <button type="submit">Add Schedule</button>
              <button type="button" onClick={closePopover}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const renderWeekView = ({
  currentDate,
  setCurrentDate,
  selectedSlot,
  setSelectedSlot,
  formData,
  setFormData,
  schedules,
  setView,
}: {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedSlot: { date: Date; hour: number; endDate: Date } | null;
  setSelectedSlot: (slot: { date: Date; hour: number; endDate: Date } | null) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  schedules: Schedule[];
  setView: (view: CalendarView) => void;
}) => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:00`;
  };

  // Get the current date and time
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Check if the current day falls within the displayed week
  // const isCurrentWeek =
  //   now >= startOfWeek && now < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Handle event slot click
  const handleEventSlotClick = (dayIndex: number, hour: number) => {
    const selectedDate = new Date(startOfWeek);
    selectedDate.setDate(startOfWeek.getDate() + dayIndex);
    selectedDate.setHours(hour, 0, 0, 0); // Set the selected hour

    const endDate = new Date(selectedDate);
    endDate.setHours(hour + 1, 0, 0, 0); // Set end time to 1 hour later

    setSelectedSlot({ date: selectedDate, hour, endDate });
  };

  // Close the popover
  const closePopover = () => {
    setSelectedSlot(null);
  };

  // Handle end date and time change
  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    newEndDate.setMinutes(0, 0);

    if (!selectedSlot) return; // Guard against null

    setSelectedSlot({
      ...selectedSlot,
      endDate: newEndDate,
    });
  };

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Fetch the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to add a schedule.");
      return;
    }

    const userId = user.id; // This is a string

    // Check if the end date is after the start date
    if (selectedSlot!.endDate <= selectedSlot!.date) {
      alert("End date must be after the start date.");
      return;
    }

    // Prepare schedule data
    const scheduleData = {
      ...formData,
      startDateTime: selectedSlot!.date.toISOString(),
      endDateTime: selectedSlot!.endDate.toISOString(),
      userId, // Use the user ID from Supabase
    };

    // Submit the schedule data to the backend
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        alert("Schedule added successfully!");
        closePopover();
      } else {
        const errorData = await response.json();
        alert(`Failed to add schedule: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error submitting schedule:", error);
      alert("An error occurred while adding the schedule.");
    }
  };

  // Function to check if a time slot is in the past
  const isPastTimeSlot = (dayIndex: number, hour: number) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(startOfWeek.getDate() + dayIndex);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  };

  // Function to check if a time slot is occupied
  const isOccupiedTimeSlot = (dayIndex: number, hour: number) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(startOfWeek.getDate() + dayIndex);
    slotDate.setHours(hour, 0, 0, 0);

    return schedules.some((schedule) => {
      const startDateTime = new Date(schedule.startDateTime);
      const endDateTime = new Date(schedule.endDateTime);
      return slotDate >= startDateTime && slotDate < endDateTime;
    });
  };

  return (
    <div className={styles.weekView}>
        {/* Header for Week View */}
        <div className={styles.weekViewHeader}>
          {/* Navigation Buttons (Left Side) */}
          <div className={styles.navigationButtons}>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}>
            <Image
              src="/back.png"
              alt="Previous Week"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}>
            <Image
              src="/next.png"
              alt="Next Week"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
            </button>
          </div>

          {/* Week Range (Centered) */}
          <h2>
            {startOfWeek.toLocaleString("default", { month: "short", day: "numeric" })} -{" "}
            {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleString("default", {
              month: "short",
              day: "numeric",
            })}
          </h2>

          {/* Dropdown for View Selection (Right Side) */}
          <div className={styles.viewSelector}>
            <select
              className={styles.viewDropdown}
              value="week" // Set the value to "week" since this is the week view
              onChange={(e) => setView(e.target.value as CalendarView)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>

      {/* Week Header (Days of the Week) */}
      <div className={styles.weekHeader}>
        <div className={styles.timeColumnHeader}></div>
        {daysOfWeek.map((day, index) => {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + index);
          return (
            <div key={index} className={styles.dayHeader}>
              <div>{day}</div>
              <div>{dayDate.toLocaleString("default", { month: "short", day: "numeric" })}</div>
            </div>
          );
        })}
      </div>

      {/* Week Body (Time Slots and Events) */}
      <div className={styles.weekBody}>
        <div className={styles.timeColumn}>
          {hours.map((hour) => (
            <div key={hour} className={styles.timeSlot}>
              {new Date(0, 0, 0, hour).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          ))}
        </div>
        <div className={styles.daysColumns}>
          {daysOfWeek.map((day, dayIndex) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + dayIndex);

            // Check if this is the current day
            const isCurrentDay =
              dayDate.getDate() === currentDay &&
              dayDate.getMonth() === currentMonth &&
              dayDate.getFullYear() === currentYear;

            return (
              <div key={dayIndex} className={styles.dayColumn}>
                {hours.map((hour) => {
                  const isCurrentTime = isCurrentDay && hour === currentHour;
                  const isPast = isPastTimeSlot(dayIndex, hour);
                  const isOccupied = isOccupiedTimeSlot(dayIndex, hour);

                  return (
                    <div
                      key={hour}
                      className={`
                        ${styles.eventSlot}
                        ${isCurrentTime ? styles.currentTime : ""}
                        ${isOccupied ? styles.occupiedSlot : ""}
                        ${isPast ? styles.pastSlot : ""}
                      `}
                      onClick={!isPast && !isOccupied ? () => handleEventSlotClick(dayIndex, hour) : undefined}
                      style={{ cursor: isPast || isOccupied ? "not-allowed" : "pointer" }}
                    >
                      {isOccupied && <span className={styles.eventLabel}>Scheduled</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover for Adding Schedule */}
      {selectedSlot && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
            <h3>Add Schedule</h3>
            <form onSubmit={handleFormSubmit}>
              <label>
                Type:
                <select
                  name="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ScheduleType })
                  }
                  required
                >
                  <option value={ScheduleType.TASK}>Task</option>
                  <option value={ScheduleType.APPOINTMENT}>Appointment</option>
                  <option value={ScheduleType.RESTDAY}>Rest Day</option>
                  <option value={ScheduleType.BLOCK}>Block</option>
                </select>
              </label>
              <label>
                Title:
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Description:
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </label>
              <label>
                Start Date:
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formatDateTimeLocal(selectedSlot.date)}
                  disabled
                />
              </label>
              <label>
                End Date:
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formatDateTimeLocal(selectedSlot.endDate)}
                  onChange={handleEndDateTimeChange}
                  step="3600"
                />
              </label>
              <label>
                All Day:
                <input
                  type="checkbox"
                  name="isAllDay"
                  checked={formData.isAllDay}
                  onChange={(e) =>
                    setFormData({ ...formData, isAllDay: e.target.checked })
                  }
                />
              </label>
              <label>
                Repeat:
                <select
                  name="repeat"
                  value={formData.repeat ? formData.repeat.frequency : "NONE"}
                  onChange={(e) => {
                    const value = e.target.value as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
                    setFormData({
                      ...formData,
                      repeat: value !== "NONE" ? { frequency: value } : null,
                    });
                  }}
                >
                  <option value="NONE">None</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              <button type="submit">Add Schedule</button>
              <button type="button" onClick={closePopover}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const renderMonthView = ({
  currentDate,
  setCurrentDate,
  setView,
}: {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    if (i < startDay || i >= startDay + daysInMonth) return null;
    return i - startDay + 1;
  });

  // Navigate to the previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to the next month
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Handle day click
  const handleDayClick = (day: number | null) => {
    if (day !== null) {
      const newDate = new Date(currentDate);
      newDate.setDate(day);
      setCurrentDate(newDate);
      setView("day"); // Switch to day view
    }
  };

  // Check if a given date is the current day
  const isCurrentDay = (day: number | null) => {
    const today = new Date();
    return (
      day !== null &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if a given date is in the past
  const isPastDay = (day: number | null) => {
    if (day === null) return false;

    const cellDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    return cellDate < today;
  };

  return (
    <div className={styles.monthView}>
  {/* Header for Month View */}
  <div className={styles.monthHeader}>
    {/* Navigation Buttons (Left Side) */}
    <div className={styles.navigationButtons}>
      <button onClick={goToPreviousMonth}>
      <Image
              src="/back.png"
              alt="Previous Month"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
      </button>
      <button onClick={goToNextMonth}>
      <Image
              src="/next.png"
              alt="Next Month"
              width={24} // Set the width of the image
              height={24} // Set the height of the image
            />
      </button>
    </div>

    {/* Month and Year (Centered) */}
    <h2>
      {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
    </h2>

    {/* Dropdown for View Selection (Right Side) */}
    <div className={styles.viewSelector}>
      <select
        className={styles.viewDropdown}
        value="month" // Set the value to "month" since this is the month view
        onChange={(e) => setView(e.target.value as CalendarView)}
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>
    </div>
  </div>

      {/* Month Grid */}
      <div className={styles.monthGrid}>
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div key={i} className={styles.monthGridHeader}>
            {d}
          </div>
        ))}

        {/* Days of the Month */}
        {cells.map((cell, index) => (
          <div
            key={index}
            className={`${styles.monthGridCell} ${
              isCurrentDay(cell) ? styles.currentDay : ""
            } ${isPastDay(cell) ? styles.pastSlot : ""}`}
            onClick={!isPastDay(cell) ? () => handleDayClick(cell) : undefined} // Disable click for past slots
            style={{ cursor: isPastDay(cell) ? "not-allowed" : "pointer" }} // Change cursor for past slots
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderYearView = ({
  currentDate,
  setCurrentDate,
  setView,
}: {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}) => {
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Navigate to the previous year
  const goToPreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to the next year
  const goToNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  // Handle month click
  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setView("month"); // Switch to month view
  };

  // Handle day click
  const handleDayClick = (day: number, monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    newDate.setDate(day);
    setCurrentDate(newDate);
    setView("day"); // Switch to day view
  };

  // Check if a given date is the current day
  const isCurrentDay = (day: number, monthIndex: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      monthIndex === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if a given month is in the past
  const isPastMonth = (monthIndex: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // If the year is in the past, the month is definitely in the past
    if (year < currentYear) return true;

    // If the year is the same, check if the month is in the past
    if (year === currentYear && monthIndex < currentMonth) return true;

    return false;
  };

  // Check if a given day is in the past
  const isPastDay = (day: number, monthIndex: number) => {
    const today = new Date();
    const cellDate = new Date(year, monthIndex, day);
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    return cellDate < today;
  };

  return (
    <div className={styles.yearView}>
        {/* Header for Year View */}
        <div className={styles.yearViewHeader}>
          {/* Navigation Buttons (Left Side) */}
          <div className={styles.navigationButtons}>
            <button onClick={goToPreviousYear}>
              <Image
                src="/back.png"
                alt="Previous Year"
                width={24} // Set the width of the image
                height={24} // Set the height of the image
              />
            </button>
            <button onClick={goToNextYear}>
              <Image
                src="/next.png"
                alt="Next Year"
                width={24} // Set the width of the image
                height={24} // Set the height of the image
              />
            </button>
          </div>

          {/* Year (Centered) */}
          <h2>{year}</h2>

          {/* Dropdown for View Selection (Right Side) */}
          <div className={styles.viewSelector}>
            <select
              className={styles.viewDropdown}
              value="year" // Set the value to "year" since this is the year view
              onChange={(e) => setView(e.target.value as CalendarView)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>

      {/* Year Grid */}
      <div className={styles.yearGrid}>
        {months.map((monthIndex) => {
          const firstDay = new Date(year, monthIndex, 1);
          const lastDay = new Date(year, monthIndex + 1, 0);
          const daysInMonth = lastDay.getDate();
          const startDay = firstDay.getDay();
          const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
          const cells = Array.from({ length: totalCells }, (_, i) => {
            if (i < startDay || i >= startDay + daysInMonth) return "";
            return i - startDay + 1;
          });

          return (
            <div
              key={monthIndex}
              className={`${styles.yearMonth} ${
                isPastMonth(monthIndex) ? styles.pastMonth : ""
              }`}
              onClick={!isPastMonth(monthIndex) ? () => handleMonthClick(monthIndex) : undefined} // Disable click for past months
              style={{ cursor: isPastMonth(monthIndex) ? "not-allowed" : "pointer" }} // Change cursor for past months
            >
              <h3>
                {new Date(year, monthIndex).toLocaleString("default", {
                  month: "short",
                })}
              </h3>
              <div className={styles.yearMonthGrid}>
                {cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`${styles.yearMonthCell} ${
                      cell && isCurrentDay(Number(cell), monthIndex)
                        ? styles.currentDay
                        : ""
                    } ${
                      cell && isPastDay(Number(cell), monthIndex) ? styles.pastSlot : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent month click from triggering
                      if (cell && !isPastDay(Number(cell), monthIndex)) {
                        handleDayClick(Number(cell), monthIndex);
                      }
                    }}
                    style={{
                      cursor:
                        cell && isPastDay(Number(cell), monthIndex) ? "not-allowed" : "pointer",
                    }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;