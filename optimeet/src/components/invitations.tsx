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

export default function Invitations() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [senderEmails, setSenderEmails] = useState<{ [key: string]: string }>({});
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase
        .from('AppointmentRequest')
        .update({
          selectedTime,
          status: 'accepted'
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error accepting invitation:', error);
        alert('Failed to accept invitation.');
        return;
      }

      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId
            ? { ...app, status: 'accepted', selectedTime }
            : app
        )
      );
      alert('Invitation accepted!');
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
        .update({
          status: 'rejected'
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error rejecting invitation:', error);
        alert('Failed to reject invitation.');
        return;
      }

      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId
            ? { ...app, status: 'rejected' }
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
                            disabled={appointment.status !== 'pending'}
                          />
                          {formattedRange}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {appointment.selectedTime && appointment.status !== 'pending' && (
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
    </div>
  );
}
