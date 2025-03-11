"use client";

import React, { useState, useEffect } from "react";
import styles from "./Calendar.module.css";

type CalendarView = "day" | "week" | "month" | "year";

const Calendar: React.FC = () => {
  const [view, setView] = useState<CalendarView>("day");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [days, setDays] = useState<Date[]>([]);

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
              >
                {/* Placeholder for events */}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
  
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
    // Format the week range (e.g., "Oct 23 - Oct 29")
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weekRange = `${startOfWeek.toLocaleString("default", {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleString("default", { month: "short", day: "numeric" })}`;
  
    // Check if a given date is the current day
    const isCurrentDay = (date: Date) => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };
  
    // Navigate to the previous week
    const goToPreviousWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    };
  
    // Navigate to the next week
    const goToNextWeek = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    };
  
    return (
      <div className={styles.weekView}>
        {/* Header for Week View */}
        <div className={styles.weekViewHeader}>
          <h2>{weekRange}</h2>
          <div className={styles.navigationButtons}>
            <button onClick={goToPreviousWeek}>Previous Week</button>
            <button onClick={goToNextWeek}>Next Week</button>
          </div>
        </div>
  
        {/* Week Header (Days of the Week) */}
        <div className={styles.weekHeader}>
          <div className={styles.timeColumnHeader}></div>
          {daysOfWeek.map((day, index) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + index);
            return (
              <div
                key={index}
                className={`${styles.dayHeader} ${
                  isCurrentDay(dayDate) ? styles.currentDay : ""
                }`}
              >
                <div>{day}</div>
                <div>
                  {dayDate.toLocaleString("default", { month: "short", day: "numeric" })}
                </div>
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
            {daysOfWeek.map((day, index) => {
              const dayDate = new Date(startOfWeek);
              dayDate.setDate(startOfWeek.getDate() + index);
              return (
                <div
                  key={index}
                  className={`${styles.dayColumn} ${
                    isCurrentDay(dayDate) ? styles.currentDay : ""
                  }`}
                >
                  {hours.map((hour) => (
                    <div key={hour} className={styles.eventSlot}>
                      {/* Placeholder for event */}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
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