"use client";

import React, { useState, useEffect } from "react";
import styles from "./Calendar.module.css";

type CalendarView = "day" | "week" | "month" | "year";
enum ScheduleType {
  TASK = "TASK",
  APPOINTMENT = "APPOINTMENT",
  RESTDAY = "RESTDAY",
  BLOCK = "BLOCK",
}
// Define the SelectedSlot type
type SelectedSlot = {
  date: Date; // Start date and time
  hour: number; // Selected hour
  endDate: Date; // End date and time
};

const Calendar: React.FC = () => {
  const [view, setView] = useState<CalendarView>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [days, setDays] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; endDate: Date } | null>(null);

  // Update view state when the dropdown selection changes
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setView(e.target.value as CalendarView);
  };

  // For Month view: Generate all the days of the current month.
  useEffect(() => {
    if (view === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
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

  // --- Render functions for each view ---
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentHour = getCurrentHour();
  
    // Format the current day and date
    const currentDay = currentDate.toLocaleString("default", { weekday: "long" });
    const currentDateFormatted = currentDate.toLocaleString("default", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    // Helper function to format date for datetime-local input
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:00`; // Always set minutes to 00
    };
  
    // Handle event slot click
    const handleEventSlotClick = (hour: number) => {
      const selectedDate = new Date(currentDate);
      selectedDate.setHours(hour, 0, 0, 0); // Set the selected hour
  
      const endDate = new Date(selectedDate);
      endDate.setHours(hour + 1, 0, 0, 0); // Set end time to 1 hour later
  
      setSelectedSlot({ date: selectedDate, hour, endDate });
      console.log("Selected slot:", selectedDate); // Debugging
    };
  
    // Close the popover
    const closePopover = () => {
      setSelectedSlot(null);
    };
  
    // Handle end time change
    const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedEndHour = parseInt(e.target.value, 10);
      const newEndDate = new Date(selectedSlot!.date);
      newEndDate.setHours(selectedEndHour, 0, 0, 0); // Set the new end hour
  
      setSelectedSlot((prev) => ({
        ...prev!,
        endDate: newEndDate,
      }));
    };
  
    // Handle form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const scheduleData = {
        type: formData.get("type") as ScheduleType,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        startDateTime: selectedSlot!.date.toISOString(),
        endDateTime: selectedSlot!.endDate.toISOString(), // Use the selected end time
        isAllDay: formData.get("isAllDay") === "on",
        repeat: formData.get("repeat") ? JSON.parse(formData.get("repeat") as string) : null,
      };
  
      // Submit the schedule data to the backend
      try {
        const response = await fetch("/api/schedules", {
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
          alert("Failed to add schedule.");
        }
      } catch (error) {
        console.error("Error submitting schedule:", error);
        alert("An error occurred while adding the schedule.");
      }
    };
  
    return (
      <div className={styles.dayView}>
        {/* Header for Day View */}
        <div className={styles.dayViewHeader}>
          <h2>{currentDay}</h2>
          <p>{currentDateFormatted}</p>
          <div className={styles.navigationButtons}>
            <button onClick={goToPreviousDay}>Previous Day</button>
            <button onClick={goToNextDay}>Next Day</button>
          </div>
        </div>
  
        {/* Time and Events Columns */}
        <div className={styles.dayViewColumns}>
          {/* Time Column */}
          <div className={styles.timeColumn}>
            {hours.map((hour) => (
              <div
                key={hour}
                className={`${styles.timeSlot} ${
                  hour === currentHour ? styles.currentTime : ""
                }`}
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
            {hours.map((hour) => (
              <div
                key={hour}
                className={`${styles.eventSlot} ${
                  hour === currentHour ? styles.currentTime : ""
                }`}
                onClick={() => handleEventSlotClick(hour)}
              >
                {/* Placeholder for events */}
              </div>
            ))}
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
                  <select name="type" required>
                    <option value={ScheduleType.TASK}>Task</option>
                    <option value={ScheduleType.APPOINTMENT}>Appointment</option>
                    <option value={ScheduleType.RESTDAY}>Rest Day</option>
                    <option value={ScheduleType.BLOCK}>Block</option>
                  </select>
                </label>
                <label>
                  Title:
                  <input type="text" name="title" required />
                </label>
                <label>
                  Description:
                  <textarea name="description" />
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
                  <select
                    name="endDateTime"
                    value={selectedSlot.endDate.getHours()} // Use the hour from endDate
                    onChange={handleEndTimeChange}
                  >
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {new Date(0, 0, 0, hour).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  All Day:
                  <input type="checkbox" name="isAllDay" />
                </label>
                <label>
                  Repeat:
                  <select name="repeat">
                    <option value="">None</option>
                    <option value='{"frequency": "DAILY"}'>Daily</option>
                    <option value='{"frequency": "WEEKLY"}'>Weekly</option>
                    <option value='{"frequency": "MONTHLY"}'>Monthly</option>
                  </select>
                </label>
                <button type="submit">Add Schedule</button>
                <button type="button" onClick={closePopover}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
  
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
    // Helper function to format date for datetime-local input
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
  
    // Get the current date and time
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
  
    // Check if the current day falls within the displayed week
    const isCurrentWeek =
      now >= startOfWeek && now < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  
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
      const newEndDate = new Date(e.target.value); // Get the new end date and time from the input
      newEndDate.setMinutes(0, 0); // Set minutes to 00
  
      setSelectedSlot((prev) => ({
        ...prev!,
        endDate: newEndDate,
      }));
    };
  
    // Handle form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
  
      // Check if the end date is after the start date
      if (selectedSlot!.endDate <= selectedSlot!.date) {
        alert("End date must be after the start date.");
        return;
      }
  
      const formData = new FormData(event.currentTarget);
      const scheduleData = {
        type: formData.get("type") as ScheduleType,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        startDateTime: selectedSlot!.date.toISOString(),
        endDateTime: selectedSlot!.endDate.toISOString(), // Use the selected end date
        isAllDay: formData.get("isAllDay") === "on",
        repeat: formData.get("repeat") ? JSON.parse(formData.get("repeat") as string) : null,
      };
  
      // Submit the schedule data to the backend
      try {
        const response = await fetch("/api/schedules", {
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
          alert("Failed to add schedule.");
        }
      } catch (error) {
        console.error("Error submitting schedule:", error);
        alert("An error occurred while adding the schedule.");
      }
    };
  
    return (
      <div className={styles.weekView}>
        {/* Header for Week View */}
        <div className={styles.weekViewHeader}>
          <h2>
            {startOfWeek.toLocaleString("default", { month: "short", day: "numeric" })} -{" "}
            {new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleString("default", {
              month: "short",
              day: "numeric",
            })}
          </h2>
          <div className={styles.navigationButtons}>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}>
              Previous Week
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}>
              Next Week
            </button>
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
  
              // Check if this is the current day and hour
              const isCurrentCell =
                isCurrentWeek &&
                dayDate.getDate() === currentDay &&
                dayDate.getMonth() === currentMonth &&
                dayDate.getFullYear() === currentYear;
  
              return (
                <div key={dayIndex} className={styles.dayColumn}>
                  {hours.map((hour) => {
                    const isCurrentTime = isCurrentCell && hour === currentHour;
  
                    return (
                      <div
                        key={hour}
                        className={`${styles.eventSlot} ${
                          isCurrentTime ? styles.currentCell : ""
                        }`} // Apply currentCell class
                        onClick={() => handleEventSlotClick(dayIndex, hour)}
                      >
                        {/* Placeholder for event */}
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
                  <select name="type" required>
                    <option value={ScheduleType.TASK}>Task</option>
                    <option value={ScheduleType.APPOINTMENT}>Appointment</option>
                    <option value={ScheduleType.RESTDAY}>Rest Day</option>
                    <option value={ScheduleType.BLOCK}>Block</option>
                  </select>
                </label>
                <label>
                  Title:
                  <input type="text" name="title" required />
                </label>
                <label>
                  Description:
                  <textarea name="description" />
                </label>
                <label>
                  Start Date:
                  <input
                    type="datetime-local"
                    name="startDateTime"
                    value={formatDateTimeLocal(selectedSlot.date)} // Use the helper function
                    disabled
                  />
                </label>
                <label>
                  End Date:
                  <input
                    type="datetime-local"
                    name="endDateTime"
                    value={formatDateTimeLocal(selectedSlot.endDate)} // Use the helper function
                    onChange={handleEndDateTimeChange} // Handle changes to the end date
                    step="3600" // Restrict the input to whole hours (3600 seconds = 1 hour)
                  />
                </label>
                <label>
                  All Day:
                  <input type="checkbox" name="isAllDay" />
                </label>
                <label>
                  Repeat:
                  <select name="repeat">
                    <option value="">None</option>
                    <option value='{"frequency": "DAILY"}'>Daily</option>
                    <option value='{"frequency": "WEEKLY"}'>Weekly</option>
                    <option value='{"frequency": "MONTHLY"}'>Monthly</option>
                  </select>
                </label>
                <button type="submit">Add Schedule</button>
                <button type="button" onClick={closePopover}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
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
  
    return (
      <div className={styles.monthView}>
        {/* Header for Month View */}
        <div className={styles.monthHeader}>
          <h2>
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h2>
          <div className={styles.navigationButtons}>
            <button onClick={goToPreviousMonth}>Previous Month</button>
            <button onClick={goToNextMonth}>Next Month</button>
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
              }`}
              onClick={() => handleDayClick(cell)} // Click to navigate to day
            >
              {cell}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
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
  
    return (
      <div className={styles.yearView}>
        {/* Header for Year View */}
        <div className={styles.yearViewHeader}>
          <h2>{year}</h2>
          <div className={styles.navigationButtons}>
            <button onClick={goToPreviousYear}>Previous Year</button>
            <button onClick={goToNextYear}>Next Year</button>
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
                className={styles.yearMonth}
                onClick={() => handleMonthClick(monthIndex)} // Click to navigate to month
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
                        isCurrentDay(Number(cell), monthIndex)
                          ? styles.currentDay
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent month click from triggering
                        if (cell) handleDayClick(Number(cell), monthIndex);
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

  return (
    <div className={styles.calendarContainer}>
      {/* Custom Dropdown for View Selection, placed on the far right */}
      <div className={styles.viewSelector}>
        <select
          className={styles.viewDropdown}
          value={view}
          onChange={handleViewChange}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* Calendar View */}
      <div className={styles.viewContent}>
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
        {view === "year" && renderYearView()}
      </div>
    </div>
  );
};

export default Calendar;