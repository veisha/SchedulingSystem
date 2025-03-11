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

  // --- Render functions for each view ---
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className={styles.dayView}>
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
        <div className={styles.eventsColumn}>
          {hours.map((hour) => (
            <div key={hour} className={styles.eventSlot}>
              {/* Placeholder for events */}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div className={styles.weekView}>
        <div className={styles.weekHeader}>
          <div className={styles.timeColumnHeader}></div>
          {daysOfWeek.map((day, index) => (
            <div key={index} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>
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
            {daysOfWeek.map((day, index) => (
              <div key={index} className={styles.dayColumn}>
                {hours.map((hour) => (
                  <div key={hour} className={styles.eventSlot}>
                    {/* Placeholder for event */}
                  </div>
                ))}
              </div>
            ))}
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

    return (
      <div className={styles.monthView}>
        <div className={styles.monthHeader}>
          <h2>
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h2>
        </div>
        <div className={styles.monthGrid}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div key={i} className={styles.monthGridHeader}>
              {d}
            </div>
          ))}
          {cells.map((cell, index) => (
            <div key={index} className={styles.monthGridCell}>
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
    return (
      <div className={styles.yearView}>
        <h2>{year}</h2>
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
              <div key={monthIndex} className={styles.yearMonth}>
                <h3>
                  {new Date(year, monthIndex).toLocaleString("default", {
                    month: "short",
                  })}
                </h3>
                <div className={styles.yearMonthGrid}>
                  {cells.map((cell, idx) => (
                    <div key={idx} className={styles.yearMonthCell}>
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
