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

interface BaseCalendarProps {
  schedules: Schedule[];
  updateDateTime: (dateTime: Date) => void;
  view: "day" | "week" | "month" | "year";
  setView: React.Dispatch<React.SetStateAction<"day" | "week" | "month" | "year">>;
}

interface ReadOnlyCalendarProps extends BaseCalendarProps {
  isReadOnly: true;
  setSchedules?: never;
  fetchSchedules?: never;
  
  // Updated type 👇
  onCreateAppointmentRequest?: (params: {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message?: string;
  }) => Promise<void>;
}

interface EditableCalendarProps extends BaseCalendarProps {
  isReadOnly?: false; // optional, defaults to false
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  fetchSchedules: () => Promise<void>;
}

type CalendarProps = ReadOnlyCalendarProps | EditableCalendarProps;


function isReadOnlyProps(props: CalendarProps): props is ReadOnlyCalendarProps {
  return props.isReadOnly === true;
}

const Calendar: React.FC<CalendarProps> = (props) => {
  const {
    schedules,
    fetchSchedules,
    updateDateTime,
    view,
    setView,
    isReadOnly = false,
  } = props;

  let onCreateAppointmentRequest: ReadOnlyCalendarProps["onCreateAppointmentRequest"] | undefined;

  if (isReadOnlyProps(props)) {
    onCreateAppointmentRequest = props.onCreateAppointmentRequest;
  }
  
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

  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type AppointmentRequestData = {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message: string;
    newStart?: string;
    newEnd?: string;
  };
  
  // In your state initialization:
  const [appointmentRequestData, setAppointmentRequestData] = useState<AppointmentRequestData>({
    proposedTimes: [],
    message: "",
    newStart: "",
    newEnd: ""
  });
  

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
  
      if (error || !user) {
        console.error("No user found or error fetching user:", error);
        setUserId(null);
        return;
      }
  
      setUserId(user.id);
    };
  
    fetchUserId();
  }, []);
  
  
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
    if (isReadOnly) return;
  
    if (!selectedSlot) {
      alert("No time slot selected!");
      return;
    }
  
    if (!userId) {
      alert("You must be logged in to add a schedule.");
      return;
    }
  
    const startDateTime = selectedSlot.date.toISOString();
    const endDateTime = selectedSlot.endDate.toISOString();
  
    const hasConflict = schedules.some((existing) => {
      const existingStart = new Date(existing.startDateTime).getTime();
      const existingEnd = new Date(existing.endDateTime).getTime();
  
      return (
        new Date(startDateTime).getTime() < existingEnd &&
        new Date(endDateTime).getTime() > existingStart
      );
    });
  
    if (hasConflict) {
      alert(
        "There's a conflict with another schedule! Please select a different time."
      );
      return;
    }
  
    try {
      const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error('⚠️ No session found:', error);
          return; // Stop the request if there's no session
        }

          const session = data.session;

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // 👈 Pass the token!
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          startDateTime,
          endDateTime,
          isAllDay: formData.isAllDay || false,
          repeat: formData.repeat || "None",
          userId,
        }),
      });
  
      if (response.ok) {
        alert("Schedule added successfully!");
  
        await fetchSchedules?.();

        closePopover();
      } else {
        const errorData = await response.json();
        alert(`Failed to add schedule: ${errorData.error}`);
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
          isReadOnly, // ✅ Pass it!
          onCreateAppointmentRequest: isReadOnly ? onCreateAppointmentRequest : undefined,
          appointmentRequestData,
          setAppointmentRequestData,
          isSubmitting,
          setIsSubmitting,
          
        });
      // In the main Calendar component's renderView function
        case "week":
          return renderWeekView({
            handleAddSchedule,
            currentDate,
            setCurrentDate,
            selectedSlot,
            setSelectedSlot,
            formData: isReadOnly
              ? {
                  type: ScheduleType.TASK,
                  title: "",
                  description: "",
                  isAllDay: false,
                  repeat: null,
                }
              : formData,
            setFormData: isReadOnly ? () => {} : setFormData,
            schedules,
            setView,
            isReadOnly,
            onCreateAppointmentRequest: isReadOnly ? onCreateAppointmentRequest : undefined,
            appointmentRequestData,
            setAppointmentRequestData,
            isSubmitting,                // ✅ Added
            setIsSubmitting,             // ✅ Added
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
  isReadOnly = false, // ✅ Add this param
  onCreateAppointmentRequest, // ✅ Add this too for handling appointment requests
  appointmentRequestData,            // 👈 Add this
  setAppointmentRequestData,         // 👈 And this
  isSubmitting,
  setIsSubmitting,
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
  isReadOnly?: boolean; // ✅ New prop
  appointmentRequestData: {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message: string;
    newStart?: string; // 👈 Add this
    newEnd?: string;   // 👈 Add this
  };
  setAppointmentRequestData: React.Dispatch<
  React.SetStateAction<{
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message: string;
    newStart?: string;  // 👈 Add this
    newEnd?: string;    // 👈 Add this
  }>
>;
  
  onCreateAppointmentRequest?: (params: {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message?: string;
  }) => Promise<void>;
    // ✅ NEW STATE TYPES HERE
    isSubmitting: boolean;
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
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
    const start = new Date(schedule.startDateTime);
    const end = new Date(schedule.endDateTime);
  
    // If end is before start, it spans midnight, so we add a day
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
  
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
  
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(24, 0, 0, 0); // end of day
  
    // Check if the schedule overlaps with the current day
    return start < dayEnd && end > dayStart;
  });
  

  const handleEventSlotClick = (hour: number) => {
    const selectedDate = new Date(currentDate);
    selectedDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(selectedDate.getTime() + 60 * 60 * 1000);

    if (isReadOnly) {
      // Set initial time values when opening popover
      setAppointmentRequestData(prev => ({
        ...prev,
        newStart: formatDateTimeLocal(selectedDate),
        newEnd: formatDateTimeLocal(endDate)
      }));
      setSelectedSlot({ date: selectedDate, hour, endDate });
      return;
    }

    setSelectedSlot({ date: selectedDate, hour, endDate });
  };

  const handleAddProposedTime = () => {
    if (!appointmentRequestData.newStart || !appointmentRequestData.newEnd) {
      alert("Please fill in both start and end times");
      return;
    }

    const startDate = new Date(appointmentRequestData.newStart);
    const endDate = new Date(appointmentRequestData.newEnd);

    if (startDate >= endDate) {
      alert("End time must be after start time");
      return;
    }

    if (startDate < new Date()) {
      alert("Cannot add time slots in the past");
      return;
    }

    // Check if any hour in the range is occupied
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    const isOccupied = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
      .some(hour => isOccupiedTimeSlot(hour, startDate));

    if (isOccupied) {
      alert("One or more hours in this range are already occupied");
      return;
    }

    setAppointmentRequestData(prev => ({
      ...prev,
      proposedTimes: [
        ...prev.proposedTimes,
        {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      ],
      newStart: "",
      newEnd: ""
    }));
  };
  

  const closePopover = () => {
    setSelectedSlot(null);
    // Reset appointment request data when closing
    setAppointmentRequestData({
      proposedTimes: [],
      message: "",
      newStart: "",
      newEnd: ""
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    if (isSubmitting) return; // prevent duplicate submits!
  
    // ✅ Validation
    if (!selectedSlot) {
      alert("❗ Please select a time slot.");
      return;
    }
  
    if (isNaN(selectedSlot.date.getTime()) || isNaN(selectedSlot.endDate.getTime())) {
      alert("❗ Invalid date/time selected.");
      console.error("❗ Invalid selectedSlot:", selectedSlot);
      return;
    }
  
    try {
      // ✅ Disable the submit button (and prevent double submits)
      setIsSubmitting(true);
  
      // ✅ Call the actual add schedule handler
      await handleAddSchedule({
        formData,
        selectedSlot,
        closePopover,
      });
  
    } catch (error) {
      console.error("❗ Error adding schedule:", error);
      alert("❗ An error occurred while adding the schedule.");
    } finally {
      // ✅ Re-enable the submit button after processing
      setIsSubmitting(false);
    }
  };
  

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:00`;
  };

  const isPastTimeSlot = (hour: number) => {
    const now = new Date();
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < now;
  };

  const isOccupiedTimeSlot = (hour: number, date: Date) => {
    return schedulesForTheDay.some((schedule) => {
      const startDate = new Date(schedule.startDateTime);
      const endDate = new Date(schedule.endDateTime);
  
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
  
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, 0, 0, 0);
  
      return slotDateTime >= startDate && slotDateTime < endDate;
    });
  };
  
  
  

  return (
    <div className={styles.dayView}>
      {/* Header */}
      <div className={styles.dayViewHeader}>
        <div className={styles.navigationButtons}>
          <button onClick={goToPreviousDay}>
            <Image src="/back.png" alt="Previous Day" width={24} height={24} />
          </button>
          <button onClick={goToNextDay}>
            <Image src="/next.png" alt="Next Day" width={24} height={24} />
          </button>
        </div>

        <div>
          <h2>{currentDay}</h2>
          <p>{currentDateFormatted}</p>
        </div>

        <div className={styles.viewSelector}>
          <select
            className={styles.viewDropdown}
            value="day"
            onChange={(e) => setView(e.target.value as CalendarView)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Time Slots */}
      <div className={styles.dayViewColumns}>
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

        <div className={styles.eventsColumn}>
          {hours.map((hour) => {
            const isOccupied = isOccupiedTimeSlot(hour, currentDate);
            const isSelected = selectedSlot && selectedSlot.hour === hour;
            const isPast = isPastTimeSlot(hour);

            return (
              <div
                key={hour}
                onClick={!isPast && !isOccupied ? () => handleEventSlotClick(hour) : undefined}
                className={`
                  ${styles.eventSlot}
                  ${hour === currentHour ? styles.currentTime : ""}
                  ${isOccupied ? styles.occupiedSlot : ""}
                  ${isSelected ? styles.selectedSlot : ""}
                  ${isPast ? styles.pastSlot : ""}
                `}
                style={{ cursor: isPast || isOccupied ? "not-allowed" : "pointer" }}
              >
                {isOccupied && <span className={styles.eventLabel}>Scheduled</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover Form */}
      {selectedSlot && (
  <div className={styles.popover}>
    <div className={styles.popoverContent}>
    {isReadOnly ? (
          <>
            <h3>Create Appointment Request</h3>
            <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (isSubmitting) return; // Prevent double submit

                  if (!appointmentRequestData.proposedTimes.length) {
                    alert("Please add at least one proposed time");
                    return;
                  }

                  try {
                    setIsSubmitting(true);

                    if (onCreateAppointmentRequest) {
                      await onCreateAppointmentRequest({
                        proposedTimes: appointmentRequestData.proposedTimes,
                        selectedTime: appointmentRequestData.selectedTime,
                        message: appointmentRequestData.message,
                      });
                      closePopover();
                    }
                  } catch (error) {
                    console.error("❗ Error creating appointment request:", error);
                    alert("❗ An error occurred while creating the request.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >

              {/* Date Input Section */}
              <div className={styles.dateInputGroup}>
                <div className={styles.dateInputRow}>
                  <label>
                    Start Date:
                    <input
                      type="datetime-local"
                      value={appointmentRequestData.newStart}
                      onChange={(e) => setAppointmentRequestData(prev => ({
                        ...prev,
                        newStart: e.target.value
                      }))}
                    />
                  </label>
                  <label>
                    End Date:
                    <input
                      type="datetime-local"
                      value={appointmentRequestData.newEnd}
                      onChange={(e) => setAppointmentRequestData(prev => ({
                        ...prev,
                        newEnd: e.target.value
                      }))}
                    />
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAddProposedTime}
                    className={styles.addButton}
                  >
                    Add Date
                  </button>
                </div>
              </div>

              {/* Proposed Dates List */}
              <div className={styles.proposedDates}>
                <h4>Proposed Dates:</h4>
                {appointmentRequestData.proposedTimes.map((time, index) => (
                  <div key={index} className={styles.dateItem}>
                    <span>
                      {new Date(time.start).toLocaleString()} - 
                      {new Date(time.end).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppointmentRequestData(prev => ({
                        ...prev,
                        proposedTimes: prev.proposedTimes.filter((_, i) => i !== index)
                      }))}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <label className={styles.messageInput}>
                Message:
                <textarea
                  value={appointmentRequestData.message}
                  onChange={(e) => setAppointmentRequestData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder="Optional message for the receiver"
                />
              </label>

              {/* Form Buttons */}
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton}>
                  Send Request
                </button>
                <button 
                  type="button" 
                  onClick={closePopover} 
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </form>
  </>
      ) : (
        // Existing Schedule Form
        <>
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
                <option value="TASK">Task</option>
                <option value="APPOINTMENT">Appointment</option>
                <option value="RESTDAY">Rest Day</option>
                <option value="BLOCK">Block</option>
              </select>
            </label>

            <label>
              Title:
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </label>

            <label>
              Description:
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>

            <label>
              Start Date:
              <input
                type="datetime-local"
                value={formatDateTimeLocal(selectedSlot.date)}
                disabled
              />
            </label>

            <label>
              End Date:
              <input
                type="datetime-local"
                value={formatDateTimeLocal(selectedSlot.endDate)}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value);
                  if (!isNaN(newEnd.getTime())) {
                    setSelectedSlot({ ...selectedSlot, endDate: newEnd });
                  }
                }}
                step="3600"
              />
            </label>

            <label>
              All Day:
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              />
            </label>

            <label>
              Repeat:
              <select
                value={formData.repeat ? formData.repeat.frequency : "NONE"}
                onChange={(e) => {
                  const value = e.target.value as RepeatType["frequency"];
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

            <div className={styles.popoverButtons}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.primaryButton}
                >
                  {isSubmitting ? "Saving..." : "Add Schedule"}
                </button>

                <button
                  type="button"
                  onClick={closePopover}
                  className={styles.secondaryButton}
                  disabled={isSubmitting} // Optional: disable cancel while submitting
                >
                  Cancel
                </button>
              </div>

          </form>
        </>
      )}
    </div>
  </div>
)}
    </div>
  );
};

const renderWeekView = ({
  handleAddSchedule,
  currentDate,
  setCurrentDate,
  selectedSlot,
  setSelectedSlot,
  formData,
  setFormData,
  schedules,
  setView,
  isReadOnly = false,
  onCreateAppointmentRequest,
  appointmentRequestData,            // 👈 Add this
  setAppointmentRequestData,         // 👈 And this
  isSubmitting,                // ✅ Added
  setIsSubmitting,             // ✅ Added
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
  setCurrentDate: (date: Date) => void;
  selectedSlot: { date: Date; hour: number; endDate: Date } | null;
  setSelectedSlot: (slot: { date: Date; hour: number; endDate: Date } | null) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  schedules: Schedule[];
  setView: (view: CalendarView) => void;
  isReadOnly?: boolean;
  appointmentRequestData: {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message: string;
  };
  setAppointmentRequestData: React.Dispatch<
    React.SetStateAction<{
      proposedTimes: Array<{ start: string; end: string }>;
      selectedTime?: string;
      message: string;
    }>
  >;
  
  onCreateAppointmentRequest?: (params: {
    proposedTimes: Array<{ start: string; end: string }>;
    selectedTime?: string;
    message?: string;
  }) => Promise<void>;
  // ✅ NEW PROPS FOR SUBMITTING STATE
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;

}) => {

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const now = new Date();

  const getCurrentHour = () => {
    const now = new Date();
    const viewedDate = new Date(currentDate);
    
    // Only highlight if it's the current week
    if (
      now.getFullYear() === viewedDate.getFullYear() &&
      now.getMonth() === viewedDate.getMonth() &&
      now.getDate() >= viewedDate.getDate() - viewedDate.getDay() &&
      now.getDate() <= viewedDate.getDate() + (6 - viewedDate.getDay())
    ) {
      return now.getHours();
    }
    return -1;
  };

  const currentHour = getCurrentHour();

// Add current time slot check
const isCurrentTimeSlot = (dayIndex: number, hour: number) => {
  const slotDate = new Date(startOfWeek);
  slotDate.setDate(startOfWeek.getDate() + dayIndex);
  return (
    slotDate.getDate() === now.getDate() &&
    slotDate.getMonth() === now.getMonth() &&
    slotDate.getFullYear() === now.getFullYear() &&
    hour === now.getHours()
  );
};

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:00`;
  };

  const handleEventSlotClick = (dayIndex: number, hour: number) => {
    const selectedDate = new Date(startOfWeek);
    selectedDate.setDate(startOfWeek.getDate() + dayIndex);
    selectedDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    if (isReadOnly) {
      const newProposedTime = {
        start: selectedDate.toISOString(),
        end: endDate.toISOString(),
      };

      setAppointmentRequestData((prev) => ({
        ...prev,
        proposedTimes: selectedSlot
          ? [...prev.proposedTimes, newProposedTime]
          : [newProposedTime],
        selectedTime: selectedSlot ? prev.selectedTime : selectedDate.toISOString(),
      }));

      if (!selectedSlot) setSelectedSlot({ date: selectedDate, hour, endDate });
      return;
    }

    setSelectedSlot({ date: selectedDate, hour, endDate });
  };

  const closePopover = () => setSelectedSlot(null);

  const handleEndDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    newEndDate.setMinutes(0, 0);
    if (!selectedSlot) return;
    setSelectedSlot({ ...selectedSlot, endDate: newEndDate });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return; // Prevent duplicate submits!

    if (!selectedSlot) {
      alert("❗ Please select a time slot.");
      return;
    }

    try {
      setIsSubmitting(true);

      await handleAddSchedule({
        formData,
        selectedSlot,
        closePopover,
      });
    } catch (error) {
      console.error("❗ Error adding schedule:", error);
      alert("❗ An error occurred while adding the schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const isPastTimeSlot = (dayIndex: number, hour: number) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(startOfWeek.getDate() + dayIndex);
    slotDate.setHours(hour, 0, 0, 0);
    return slotDate < now;
  };

  const isOccupiedTimeSlot = (dayIndex: number, hour: number) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(startOfWeek.getDate() + dayIndex);
    slotDate.setHours(hour, 0, 0, 0);
    return schedules.some(schedule => {
      const start = new Date(schedule.startDateTime);
      const end = new Date(schedule.endDateTime);
      return slotDate >= start && slotDate < end;
    });
  };

  return (
    <div className={styles.weekView}>
      {/* Header */}
      <div className={styles.weekViewHeader}>
        <div className={styles.navigationButtons}>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}>
            <Image src="/back.png" alt="Previous Week" width={24} height={24} />
          </button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}>
            <Image src="/next.png" alt="Next Week" width={24} height={24} />
          </button>
        </div>

        <h2>
          {startOfWeek.toLocaleDateString("default", { month: "short", day: "numeric" })} - {" "}
          {new Date(startOfWeek.getTime() + 6 * 86400000).toLocaleDateString("default", { 
            month: "short", 
            day: "numeric" 
          })}
        </h2>

        <div className={styles.viewSelector}>
          <select
            className={styles.viewDropdown}
            value="week"
            onChange={(e) => setView(e.target.value as CalendarView)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Week Grid */}
      <div className={styles.weekHeader}>
        <div className={styles.timeColumnHeader}></div>
        {daysOfWeek.map((day, index) => {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + index);
          return (
            <div key={index} className={styles.dayHeader}>
              <div>{day}</div>
              <div>{dayDate.toLocaleDateString("default", { month: "short", day: "numeric" })}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.weekBody}>
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
                minute: "2-digit" 
              })}
            </div>
          ))}
        </div>

        <div className={styles.daysColumns}>
          {daysOfWeek.map((_, dayIndex) => (
            <div key={dayIndex} className={styles.dayColumn}>
              {hours.map((hour) => {
                const isPast = isPastTimeSlot(dayIndex, hour);
                const isOccupied = isOccupiedTimeSlot(dayIndex, hour);
                const isCurrent = isCurrentTimeSlot(dayIndex, hour);
                
                return (
                  <div
                    key={hour}
                    className={`${styles.eventSlot} 
                      ${isOccupied ? styles.occupiedSlot : ""}
                      ${isPast ? styles.pastSlot : ""}
                      ${isCurrent ? styles.currentTime : ""}`}
                    onClick={!isPast && !isOccupied ? () => handleEventSlotClick(dayIndex, hour) : undefined}
                    style={{ cursor: isPast || isOccupied ? "not-allowed" : "pointer" }}
                  >
                    {isOccupied && <span className={styles.eventLabel}>Scheduled</span>}
                    {isCurrent && <div className={styles.currentTimeMarker} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Popover Form */}
      {selectedSlot && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
              {isReadOnly ? (
              <>
                <h3>Create Appointment Request</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();

                  if (isSubmitting) return;

                  if (!appointmentRequestData.proposedTimes.length) {
                    alert("Please add at least one proposed time.");
                    return;
                  }

                  try {
                    setIsSubmitting(true);

                    if (onCreateAppointmentRequest) {
                      await onCreateAppointmentRequest({
                        proposedTimes: appointmentRequestData.proposedTimes,
                        selectedTime: appointmentRequestData.selectedTime,
                        message: appointmentRequestData.message
                      });
                      setSelectedSlot(null);
                    }
                  } catch (error) {
                    console.error("❗ Error creating appointment request:", error);
                    alert("❗ An error occurred while sending the request.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}>

                  <div className={styles.proposedTimesList}>
                    {appointmentRequestData.proposedTimes.map((time, index) => (
                      <div key={index} className={styles.proposedTimeItem}>
                        <label>
                          <input
                            type="radio"
                            name="selectedTime"
                            checked={appointmentRequestData.selectedTime === time.start}
                            onChange={() => setAppointmentRequestData(prev => ({
                              ...prev,
                              selectedTime: time.start
                            }))}
                          />
                          {new Date(time.start).toLocaleString()} - {new Date(time.end).toLocaleString()}
                        </label>
                        <button
                          type="button"
                          onClick={() => setAppointmentRequestData(prev => ({
                            ...prev,
                            proposedTimes: prev.proposedTimes.filter((_, i) => i !== index),
                            selectedTime: prev.selectedTime === time.start ? undefined : prev.selectedTime
                          }))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className={styles.addAnother}>
                    <button type="button" onClick={() => setSelectedSlot(null)}>
                      Click another available slot to add more times
                    </button>
                  </div>

                  <label>
                    Message (optional):
                    <textarea
                      value={appointmentRequestData.message}
                      onChange={(e) => setAppointmentRequestData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Add a message to the receiver"
                    />
                  </label>

                  <div className={styles.popoverButtons}>
                    <button type="submit">Send Request</button>
                    <button type="button" onClick={closePopover}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Schedule Form
              <>
                <h3>Add Schedule</h3>
                <form onSubmit={handleFormSubmit}>
                  <label>
                    Type:
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                      required
                    >
                      {Object.values(ScheduleType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title:
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Description:
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </label>
                  <label>
                    Start Date:
                    <input
                      type="datetime-local"
                      value={formatDateTimeLocal(selectedSlot.date)}
                      disabled
                    />
                  </label>
                  <label>
                    End Date:
                    <input
                      type="datetime-local"
                      value={formatDateTimeLocal(selectedSlot.endDate)}
                      onChange={handleEndDateTimeChange}
                      step="3600"
                    />
                  </label>
                  <label>
                    All Day:
                    <input
                      type="checkbox"
                      checked={formData.isAllDay}
                      onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                    />
                  </label>
                  <label>
                    Repeat:
                    <select
                      value={formData.repeat?.frequency || "NONE"}
                      onChange={(e) => {
                        const value = e.target.value as RepeatType["frequency"];
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
                  <div className={styles.popoverButtons}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={styles.primaryButton}
                    >
                      {isSubmitting ? "Saving..." : "Add Schedule"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={closePopover}
                      className={styles.secondaryButton}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              </>
            )}
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