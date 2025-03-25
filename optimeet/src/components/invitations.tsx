'use client';

import { useState } from 'react';
import styles from './invitations.module.css';
import { supabase } from '@/lib/supabase';

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

interface InvitationsProps {
  fetchAppointments: () => Promise<void>;
  appointments: AppointmentRequest[];
  senderEmails: { [key: string]: string };
  fetchSchedules: () => Promise<void>;
  schedules: Schedule[];
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function formatDateTimeRange(start: Date, end: Date): string {
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit' 
  };

  return `${start.toLocaleDateString('en-US', dateOptions)} ${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
}

export default function Invitations({
  fetchAppointments,
  appointments,
  senderEmails,
  fetchSchedules,
  schedules,
}: InvitationsProps) {
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ 
    date: Date; 
    endDate: Date;
    appointmentId: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    type: 'APPOINTMENT',
    title: '',
    description: '',
    isAllDay: false,
    repeat: 'None',
  });

  const handleTimeSelect = (appointmentId: string, selectedTime: string) => {
    setSelectedTimes(prev => ({
      ...prev,
      [appointmentId]: selectedTime
    }));
  };

  const handleAccept = async (appointmentId: string) => {
    const selectedTime = selectedTimes[appointmentId];

    if (!selectedTime) {
      alert('Please select a time before accepting!');
      return;
    }

    setLoading(true);

    try {
      const startDate = new Date(selectedTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      
      const appointment = appointments.find(a => a.id === appointmentId);
      const senderName = senderEmails[appointment?.senderId || ''] || 'Unknown';

      setShowSchedulePopover(true);
      setSelectedSlot({
        date: startDate,
        endDate: endDate,
        appointmentId: appointmentId
      });

      setFormData({
        type: 'APPOINTMENT',
        title: `Meeting with ${senderName}`,
        description: appointment?.message || '',
        isAllDay: false,
        repeat: 'None',
      });

    } catch (error) {
      console.error('Error preparing acceptance:', error);
      alert('Failed to start acceptance process');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to reject this invitation?')) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('AppointmentRequest')
        .update({ status: 'REJECTED' })
        .eq('id', appointmentId);

      if (error) throw error;

      await fetchAppointments();
      alert('Invitation rejected!');
    } catch (error) {
      console.error('Reject error:', error);
      let errorMessage = 'An error occurred while rejecting.';
      
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot?.appointmentId) {
      alert('No appointment selected!');
      return;
    }

    setLoading(true);

    try {
      const startDateTime = selectedSlot.date.toISOString();
      const endDateTime = selectedSlot.endDate.toISOString();

      const hasConflict = schedules.some((existing) => {
        const existingStart = new Date(existing.startDateTime).getTime();
        const existingEnd = new Date(existing.endDateTime).getTime();
        const newStart = new Date(startDateTime).getTime();
        const newEnd = new Date(endDateTime).getTime();

        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
        throw new Error("There's a conflict with another schedule! Please select a different time.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          startDateTime,
          endDateTime,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      const { error } = await supabase
        .from('AppointmentRequest')
        .update({
          selectedTime: startDateTime,
          status: 'ACCEPTED',
        })
        .eq('id', selectedSlot.appointmentId);

      if (error) throw error;

      await Promise.all([fetchAppointments(), fetchSchedules()]);
      setShowSchedulePopover(false);
      alert('Appointment successfully accepted and scheduled!');

    } catch (error) {
      console.error("Error in acceptance process:", error);
      let errorMessage = "Failed to complete acceptance";
      
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Invitations</h1>

      {appointments.length === 0 ? (
        <p>No invitations found.</p>
      ) : (
        appointments.map((appointment) => (
          <div key={appointment.id} className={styles.invitationCard}>
            <div className={styles.cardHeader}>
              <h3>Appointment Request</h3>
              <span className={`${styles.status} ${styles[appointment.status.toLowerCase()]}`}>
                {appointment.status}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.detailItem}>
                <label>From:</label>
                <p>{senderEmails[appointment.senderId] || 'Unknown sender'}</p>
              </div>

              <div className={styles.detailItem}>
                <label>Message:</label>
                <p>{appointment.message || 'No message provided'}</p>
              </div>

              <div className={styles.detailItem}>
                <label>Proposed Times:</label>
                <ul className={styles.timeList}>
                  {appointment.proposedTimes.map((timeRange, index) => {
                    const [startTime, endTime] = timeRange;
                    const start = new Date(startTime);
                    const end = new Date(endTime);

                    const formattedRange = `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })} - ${end.toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}`;

                    return (
                      <li key={index} className={styles.timeOption}>
                        <label>
                          <input
                            type="radio"
                            name={`selectTime-${appointment.id}`}
                            value={startTime}
                            checked={selectedTimes[appointment.id] === startTime}
                            onChange={() => handleTimeSelect(appointment.id, startTime)}
                            disabled={appointment.status !== 'PENDING'}
                          />
                          {formattedRange}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {appointment.status === 'PENDING' && (
                <div className={styles.actions}>
                  <button
                    onClick={() => handleReject(appointment.id)}
                    disabled={loading}
                    className={styles.rejectButton}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(appointment.id)}
                    disabled={loading}
                    className={styles.acceptButton}
                  >
                    {loading ? 'Processing...' : 'Accept'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {showSchedulePopover && selectedSlot && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
            <h3>Confirm Appointment Schedule</h3>
            <form onSubmit={handleAddSchedule}>
              {/* Time Display Section */}
              <div className={styles.timeDisplay}>
                <label>Scheduled Time:</label>
                <p>{formatDateTimeRange(selectedSlot.date, selectedSlot.endDate)}</p>
              </div>

              <div className={styles.formGroup}>
                <label>Title:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                  />
                  All Day Event
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Repeat:</label>
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                >
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.confirmButton} disabled={loading}>
                  {loading ? 'Saving...' : 'Confirm & Accept'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowSchedulePopover(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}