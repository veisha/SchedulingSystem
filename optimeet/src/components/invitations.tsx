'use client';

import { useEffect, useState } from 'react';
import styles from './invitations.module.css';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/supabaseHelpers';

interface AppointmentRequest {
  id: string;
  senderId: string;
  receiverId: string;
  proposedTimes: string[];
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
      try {
        console.log('Starting to fetch appointments...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        console.log('Fetching appointments for user ID:', user.id);
        
        const { data, error } = await supabase
          .from('AppointmentRequest')
          .select('*')
          .eq('receiverId', user.id);

        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }

        console.log('Raw appointment data from database:', data);
        
        setAppointments(data || []);
        console.log('Appointments state updated:', data || []);

        // Fetch sender emails
        const emailsMap: { [key: string]: string } = {};
        for (const appointment of data || []) {
          if (!emailsMap[appointment.senderId]) {
            console.log(`Fetching email for sender ID: ${appointment.senderId}`);
            const email = await getUserById(appointment.senderId);
            if (email) {
              emailsMap[appointment.senderId] = email;
              console.log(`Found email for ${appointment.senderId}: ${email}`);
            } else {
              console.warn(`No email found for sender ID: ${appointment.senderId}`);
            }
          }
        }
        
        console.log('Completed email mapping:', emailsMap);
        setSenderEmails(emailsMap);

      } catch (error) {
        console.error('Error in fetchAppointments:', error);
      }
    };

    fetchAppointments();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      console.log('Attempting to accept appointment ID:', id);
      
      const { error } = await supabase
        .from('AppointmentRequest')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (error) {
        console.error('Accept error:', error);
        return;
      }

      console.log('Successfully accepted appointment ID:', id);
      
      setAppointments(prev =>
        prev.map(appt =>
          appt.id === id ? { ...appt, status: 'accepted' } : appt
        )
      );
    } catch (error) {
      console.error('Error in handleAccept:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      console.log('Attempting to reject appointment ID:', id);
      
      const { error } = await supabase
        .from('AppointmentRequest')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) {
        console.error('Reject error:', error);
        return;
      }

      console.log('Successfully rejected appointment ID:', id);
      
      setAppointments(prev =>
        prev.map(appt =>
          appt.id === id ? { ...appt, status: 'rejected' } : appt
        )
      );
    } catch (error) {
      console.error('Error in handleReject:', error);
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
                  {appointment.proposedTimes.map((time, index) => (
                    <li key={index}>
                      {new Date(time).toLocaleString([], {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </li>
                  ))}
                </ul>
              </div>

              {appointment.selectedTime && (
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
            </div>

            <div className={styles.cardFooter}>
              {appointment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAccept(appointment.id)}
                    className={styles.acceptButton}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(appointment.id)}
                    className={styles.rejectButton}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}