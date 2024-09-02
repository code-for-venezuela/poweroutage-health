import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import styles from './DeviceStatuses.module.css';
import DeviceStatusSection from '@/components/DeviceStatusSection';

interface Event {
    id: string;
    payload: {
        status: string;
        device_id: string;
        sent_at: string;
    };
    createdAt: string;
}

export default function DeviceStatuses() {
    const [events, setEvents] = useState<Event[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const observer = useRef<IntersectionObserver>();

    const fetchEvents = async (cursor: string | null = null) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/device-statuses?cursor=${cursor}`);
            const data = await res.json();
            setEvents(prevEvents => [...prevEvents, ...data.events]);
            setCursor(data.nextCursor);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const lastEventElementRef = useCallback(
        (node: HTMLTableRowElement) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && cursor) {
                    fetchEvents(cursor);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, cursor]
    );

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <Head>
                <title>Dashboard Operativo</title>
                <meta name="description" content="Estado actual de los dispositivos monitoreados" />
            </Head>

            <header className={styles.header}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Dashboard Operativo</h1>
                </div>
            </header>

            <main className={styles.main}>

                {/* Include the DeviceStatusSection component here */}
                <section className={styles.contentSection}>
                    <DeviceStatusSection />
                </section>

                <section className={styles.contentSection}>
                    <h2 className={styles.heading}>Logs de todos los dispostivos</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Device ID</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event, index) => (
                                    <tr
                                        key={event.id}
                                        ref={index === events.length - 1 ? lastEventElementRef : null}
                                        className={styles.eventRow}
                                    >
                                        <td>{event.payload.device_id}</td>
                                        <td>{event.payload.status} </td>
                                        <td>{new Date(event.payload.sent_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {loading && <p className={styles.loadingIndicator}>Loading more events...</p>}
                </section>
            </main>

            <footer className={styles.footer}>
                <p>&copy; 2024 Todos los derechos Reservados.</p>
            </footer>
        </div>
    );
}