"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import DeviceStatusSection from '@/components/DeviceStatusSection';
import { Breadcrumbs } from "@/components/parts/breadcrumbs";
import { Header } from "@/components/parts/header";
import { PageWrapper } from "@/components/parts/page-wrapper";

interface Event {
    id: string;
    payload: {
        status: string;
        device_id: string;
        sent_at: string;
    };
    createdAt: string;
}

const pageData = {
    name: "Monitores",
    title: "Monitores",
    description: "Estado Actual De los Monitores",
};


export default function DeviceStatuses() {
    const [events, setEvents] = useState<Event[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const observer = useRef<IntersectionObserver>();
    const hasFetched = useRef(false);

    const fetchEvents = async (cursor: string | null = null) => {
        if (hasFetched.current && cursor === null) return; // Prevent duplicate fetches for cursor=null
        hasFetched.current = true
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
        <>
            <Breadcrumbs pageName={pageData?.name} />
            <PageWrapper>
                <Header title={pageData?.title}>{pageData?.description}</Header>
                <div >
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
                                        <th>Event ID</th>
                                        <th>Device ID</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event, index) => (
                                        <tr
                                            key={`logs-${event.id}`}
                                            ref={index === events.length - 1 ? lastEventElementRef : null}
                                            className={styles.eventRow}
                                        >
                                            <td>{event.id}</td>
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
                </div>

            </PageWrapper>
        </>
    );
}