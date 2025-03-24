'use client';

import { useEffect, useState } from 'react';
import styles from './invitations.module.css';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/supabaseHelpers';

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
  fetchSchedules: () => Promise<void>;
  schedules: Schedule[];
}

export default function Invitations({ fetchSchedules, schedules }: InvitationsProps) {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [senderEmails, setSenderEmails] = useState<{ [key: string]: string }>({});
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; endDate: Date } | null>(null);
  const [formData, setFormData] = useState({
    type: 'APPOINTMENT',
    title: '',
    description: '',
    isAllDay: false,
    repeat: 'None',
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        const { data, error } = await supabase
          .from('AppointmentRequest')
          .select('*')
          .eq('receiverId', user.id);

        if (error) {
          console.error('Error fetching appointments:', error);
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
      } catch (error) {
        console.error('Error in fetchAppointments:', error);
      }
    };

    fetchAppointments();
  }, []);

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
      console.log('Attempting to accept appointment with ID:', appointmentId);
      console.log('Selected time:', selectedTime);
  
      const { data: existing } = await supabase
        .from('AppointmentRequest')
        .select('*')
        .eq('id', appointmentId);
  
      console.log('Existing appointment:', existing);
  
      const { data, error } = await supabase
        .from('AppointmentRequest')
        .update({
          selectedTime,
          status: 'ACCEPTED',
        })
        .eq('id', appointmentId)
        .select('*');  // <-- specify columns to return
  
      if (error) {
        console.error('Error accepting invitation:', error.message);
        alert('Failed to accept invitation.');
        return;
      }
  
      console.log('Updated appointment:', data);
  
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointmentId
            ? { ...app, status: 'ACCEPTED', selectedTime }
            : app
        )
      );
  
      setSelectedSlot({
        date: new Date(selectedTime),
        endDate: new Date(new Date(selectedTime).getTime() + 60 * 60 * 1000),
      });
      setShowSchedulePopover(true);
    } catch (err) {
      console.error('Accept error:', err);
      alert('An error occurred while accepting.');
    }
  
    setLoading(false);
  };
  
  

  const handleReject = async (appointmentId: string) => {
    const confirmReject = confirm('Are you sure you want to reject this invitation?');
    if (!confirmReject) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('AppointmentRequest')
        .update({ status: 'REJECTED' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error rejecting invitation:', error);
        alert('Failed to reject invitation.');
        return;
      }

      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId
            ? { ...app, status: 'REJECTED' }
            : app
        )
      );

      alert('Invitation rejected!');
    } catch (err) {
      console.error('Reject error:', err);
      alert('An error occurred while rejecting.');
    }

    setLoading(false);
  };

  const handleAddSchedule = async () => {
    if (!selectedSlot) {
      alert('No time slot selected!');
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
      alert("There's a conflict with another schedule! Please select a different time.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error('No session found:', error);
        return;
      }

      const session = data.session;

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description,
          startDateTime,
          endDateTime,
          isAllDay: formData.isAllDay,
          repeat: formData.repeat,
          userId: data.session.user.id,
        }),
      });

      if (response.ok) {
        alert("Schedule added successfully!");
        await fetchSchedules();
        setShowSchedulePopover(false);
        setFormData({
          type: 'APPOINTMENT',
          title: '',
          description: '',
          isAllDay: false,
          repeat: 'None',
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to add schedule: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error adding schedule:", error);
      alert("An error occurred while adding the schedule.");
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
              <span className={`${styles.status} ${styles[appointment.status]}`}>
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

              {appointment.selectedTime && appointment.status !== 'PENDING' && (
                <div className={styles.detailItem}>
                  <label>Selected Time:</label>
                  <p>
                    {new Date(appointment.selectedTime).toLocaleString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {appointment.status === 'PENDING' && (
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.acceptButton}
                    onClick={() => handleAccept(appointment.id)}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => handleReject(appointment.id)}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Popover for Adding Schedule */}
      {showSchedulePopover && selectedSlot && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
            <h3>Add Schedule</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleAddSchedule();
            }}>
              <label>
                Type:
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                Repeat:
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                >
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </label>

              <label>
                All Day:
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                />
              </label>

              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowSchedulePopover(false)}
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
