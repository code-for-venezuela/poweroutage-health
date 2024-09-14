import dynamic from 'next/dynamic';
import React from 'react';
import 'leaflet/dist/leaflet.css';


const Map = dynamic(() => import('../components/Map'), {
    ssr: false, // Disable server-side rendering for this import
});

const Outages: React.FC = () => {

    return (
        <>
            <h1>Estado Actual Energía</h1>
            <p>Estado de las subestaciones</p>
            <div>
                <Map />
            </div>
        </>

    );
};

export default Outages;