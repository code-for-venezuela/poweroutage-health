import { useState, useEffect } from 'react';
import styles from './DeviceStatusSection.module.css';
import axios from 'axios';
import { format, subHours } from 'date-fns';


interface Event {
    id: string;
    payload: {
        status: string;
        device_id: string;
        sent_at: string;
    };
    createdAt: string;
}

interface DeviceStatus {
    deviceId: string;
    status: string;
    sentAt: string;
}



const DeviceStatusSection = () => {
    const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
    const deviceIds = ['smart-glitter', 'calm-teapot', 'icy-dawn', 'stormy-night', 'damp-sky', 'defiant-fire']; // Hard-coded list of deviceIds

    useEffect(() => {
        const fetchDeviceStatuses = async () => {
            try {
                const response = await axios.get('/api/device-statuses', {
                    params: {
                        deviceIds,
                        take: 50
                    }
                });

                if (response.status !== 200) {
                    throw "error fetching device status data"
                }

                const events: Event[] = response.data.events;

                const now = new Date();
                const twentyFourHoursAgo = subHours(now, 24);

                const statuses = deviceIds.map(deviceId => {
                    const latestEvent = events.find(event =>
                        event.payload.device_id === deviceId
                    );

                    if (latestEvent && new Date(latestEvent.createdAt) >= twentyFourHoursAgo) {
                        return {
                            deviceId,
                            status: latestEvent.payload.status, // Assuming status is part of the payload
                            sentAt: format(new Date(latestEvent.createdAt), 'yyyy-MM-dd HH:mm:ss')
                        };
                    }
                    else if (latestEvent && new Date(latestEvent.createdAt) < twentyFourHoursAgo) {
                        return {
                            deviceId,
                            status: 'offline',
                            sentAt: format(new Date(latestEvent.createdAt), 'yyyy-MM-dd HH:mm:ss')
                        };
                    } else {
                        return {
                            deviceId,
                            status: 'offline',
                            sentAt: 'Unkown'
                        };
                    }
                });

                setDeviceStatuses(statuses);
            } catch (error) {
                console.error('Error fetching device statuses:', error);
            }
        };

        fetchDeviceStatuses();
    }, []);

    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'restarting':
                return styles.statusRestarting;
            case 'healthy':
                return styles.statusHealthy;
            case 'offline':
                return styles.statusOffline;
            default:
                return '';
        }
    };

    return (
        <div>
            <h2 className={styles.heading}> Estado Actual De los Monitores </h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID Del Monitor</th>
                            <th>Status</th>
                            <th>Fecha del Último Reporte</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deviceStatuses.map(({ deviceId, status, sentAt }) => (
                            <tr key={deviceId} className={styles.eventRow}>
                                <td>{deviceId}</td>
                                <td className={getStatusClass(status)}>{status}</td>
                                <td>{sentAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeviceStatusSection;