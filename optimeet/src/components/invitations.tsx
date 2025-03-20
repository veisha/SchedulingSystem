'use client';

import { useEffect, useState } from 'react';
import styles from './invitations.module.css';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/supabaseHelpers'; // assuming you placed it here

interface AppointmentRequest {
  id: string;
  senderId: string;
  receiverId: string;
  proposedTimes: string[]; // assuming it's an array of ISO strings
  selectedTime: string | null;
  status: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export default function Invitations() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [senderEmails, setSenderEmails] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchAppointments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user.');
        return;
      }

      const { data, error } = await supabase
        .from('AppointmentRequest')
        .select('*')
        .eq('receiverId', user.id);

      if (error) {
        console.error('Error fetching appointments:', error.message);
        return;
      }

      setAppointments(data || []);

      // Fetch sender emails for each appointment
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
    };

    fetchAppointments();
  }, []);

  const handleAccept = async (id: string) => {
    await supabase
      .from('AppointmentRequest')
      .update({ status: 'accepted' })
      .eq('id', id);

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: 'accepted' } : appt
      )
    );
  };

  const handleReject = async (id: string) => {
    await supabase
      .from('AppointmentRequest')
      .update({ status: 'rejected' })
      .eq('id', id);

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === id ? { ...appt, status: 'rejected' } : appt
      )
    );
  };

  return (
    <div className={styles.container}>
      <h1>Invitations</h1>
      {appointments.length === 0 ? (
        <p>No invitations found.</p>
      ) : (
        appointments.map((appointment) => (
          <form key={appointment.id} className={styles.invitationForm}>
            <p><strong>From:</strong> {senderEmails[appointment.senderId] || 'Loading...'}</p>
            <p><strong>Message:</strong> {appointment.message}</p>

            <p><strong>Proposed Times:</strong></p>
            <ul>
              {appointment.proposedTimes.map((time, index) => (
                <li key={index}>{new Date(time).toLocaleString()}</li>
              ))}
            </ul>

            {appointment.selectedTime && (
              <p><strong>Selected Time:</strong> {new Date(appointment.selectedTime).toLocaleString()}</p>
            )}

            <p><strong>Status:</strong> {appointment.status}</p>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => handleAccept(appointment.id)}
                disabled={appointment.status === 'accepted'}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleReject(appointment.id)}
                disabled={appointment.status === 'rejected'}
              >
                Reject
              </button>
            </div>
          </form>
        ))
      )}
    </div>
  );
}
