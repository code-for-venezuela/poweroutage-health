import dynamic from 'next/dynamic';
import React from 'react';
import 'leaflet/dist/leaflet.css';


const Map = dynamic(() => import('../components/Map'), {
    ssr: false, // Disable server-side rendering for this import
});

interface OutagesProps {
    initialCoordinates?: [number, number]; // Optional prop for initial coordinates
}

const Outages: React.FC<OutagesProps> = ({ initialCoordinates = [10.48801, -66.87919] }) => {

    return (
        <>
            <h1>Estado Actual Energía</h1>
            <div>
                <Map />
            </div>
        </>

    );
};

export default Outages;