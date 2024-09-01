import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import styles from './DeviceStatuses.module.css';

interface Event {
    id: string;
    payload: {
        restart: boolean;
        device_id: string;
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
                <title>Estado de Dispositivos</title>
                <meta name="description" content="Estado actual de los dispositivos monitoreados" />
            </Head>

            <header className={styles.header}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Estado de Dispositivos</h1>
                </div>
            </header>

            <main className={styles.main}>
                <section className={styles.contentSection}>
                    <h2 className={styles.heading}>Dispositivos Monitoreados</h2>

                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Device ID</th>
                                <th>Restart</th>
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
                                    <td>{event.payload.restart ? 'Yes' : 'No'}</td>
                                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {loading && <p className={styles.loadingIndicator}>Loading more events...</p>}
                </section>
            </main>

            <footer className={styles.footer}>
                <p>&copy; 2024 Todos los derechos Reservados.</p>
            </footer>
        </div>
    );
}