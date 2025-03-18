'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import styles from './SharedSchedules.module.css';

interface Schedule {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  repeat: string;
}

export default function SharedSchedules() {
  const params = useParams();
  const id = params?.id as string;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedSchedules = async () => {
      try {
        console.log('🔎 Fetching shared schedule from API...');
        console.log('➡️ Shared Schedule ID:', id);

        if (!id) {
          console.warn('⚠️ No ID provided in URL params.');
          return;
        }

        // Call your Next.js API route (not Supabase directly)
        const response = await fetch(`/api/shared-schedules?id=${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shared schedule');
        }

        const { sharedSchedule } = await response.json();

        console.log('✅ API response sharedSchedule:', sharedSchedule);

        const scheduleIds = sharedSchedule.scheduleIds || [];

        if (!scheduleIds.length) {
          console.info('ℹ️ No schedule IDs found in shared schedule.');
          setSchedules([]);
          setLoading(false);
          return;
        }

        // Now fetch the actual schedules by IDs from another API route (optional)
        console.log('🔎 Fetching schedules from API by IDs...');

        const schedulesResponse = await fetch(`/api/schedules-by-ids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleIds }),
        });

        if (!schedulesResponse.ok) {
          const errorData = await schedulesResponse.json();
          throw new Error(errorData.error || 'Failed to fetch schedules');
        }

        const { schedules: latestSchedules } = await schedulesResponse.json();

        console.log('✅ Final fetched schedules:', latestSchedules);

        setSchedules(latestSchedules || []);
      } catch (error) {
        console.error('❗Fetch error:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSchedules();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading shared schedules...</p>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Shared Schedules</title>
        <meta name="description" content="View shared schedules created by users." />
      </Head>

      <h1 className={styles.headingPrimary}>Shared Schedules</h1>

      {schedules.length === 0 ? (
        <p className={styles.paragraph}>No schedules found for this shared link.</p>
      ) : (
        <ul className={styles.scheduleList}>
          {schedules.map(schedule => (
            <li key={schedule.id} className={styles.scheduleItem}>
              <h2 className={styles.headingSecondary}>{schedule.title}</h2>
              <p className={styles.paragraph}>{schedule.description}</p>
              <p className={styles.paragraph}>
                <strong>Start:</strong> {new Date(schedule.startDateTime).toLocaleString()}
              </p>
              <p className={styles.paragraph}>
                <strong>End:</strong> {new Date(schedule.endDateTime).toLocaleString()}
              </p>
              <p className={styles.paragraph}>
                <strong>All Day:</strong> {schedule.isAllDay ? 'Yes' : 'No'}
              </p>
              <p className={styles.paragraph}>
                <strong>Repeat:</strong> {schedule.repeat}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
