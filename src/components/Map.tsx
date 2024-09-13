// components/Map.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import L from 'leaflet';


const Map: React.FC = () => {
    const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);
    const [highlightedStates, setHighlightedStates] = useState<Set<string>>(new Set());


    const defaultStyle = {
        color: '#3388ff',
        weight: 2,
        opacity: 1,
        fillColor: '#6baed6',
        fillOpacity: 0.5,
    };

    const highlightStyle = {
        color: '#228B22',    // Outline color
        weight: 2,
        opacity: 1,
        fillColor: '#32CD32', // Fill color (green)
        fillOpacity: 0.7,
    };

    const styleFeature = (feature) => {
        const stateName = feature.properties.name; // Adjust according to your GeoJSON properties
        if (highlightedStates.has(stateName)) {
            return highlightStyle;
        } else {
            return defaultStyle;
        }
    };



    useEffect(() => {
        const fetchGeoJSON = async () => {
            const response = await fetch('/ve.json');
            const data = await response.json();
            setGeoData(data);
        };

        fetchGeoJSON();
    }, []);

    // Inside your component or a useEffect
    useEffect(() => {
        if (!geoData) return;
        const coordinatesArray = [
            { lat: 10.4806, lng: -66.9036 }, // Example coordinate in Caracas
            { lat: 8.5933, lng: -71.1448 },  // Another coordinate
            // ... more coordinates
        ];

        const statesWithPoints = new Set<string>();

        // Create a Leaflet GeoJSON layer for spatial querying
        const geoJsonLayer = L.geoJSON(geoData);

        coordinatesArray.forEach((point) => {
            const latLng = L.latLng(point.lat, point.lng);

            // Find all layers (states) that contain this point
            geoJsonLayer.eachLayer((layer) => {
                const polygon = layer as L.Polygon;

                if (polygon.getBounds().contains(latLng)) {
                    if (polygon instanceof L.Polygon) {
                        const inside = L.Polygon.prototype.contains.call(polygon, latLng);
                        if (inside) {
                            const stateName = layer.feature?.properties?.name; // Adjust based on your GeoJSON properties
                            if (stateName) {
                                statesWithPoints.add(stateName);
                            }
                        }
                    }
                }
            });
        });

        // Save the list of states to state
        setHighlightedStates(statesWithPoints);
    }, [geoData]);

    const onEachFeature = (feature: any, layer: any) => {
        const stateName = feature.properties.name; // Adjust according to your GeoJSON properties
        layer.bindTooltip(stateName);

        layer.on({
            mouseover: (e: any) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 5,
                    color: '#666',
                    fillOpacity: 0.7,
                });
            },
            mouseout: (e: any) => {
                const layer = e.target;
                layer.setStyle(styleFeature(feature));
            },
            click: (e: any) => {
                const map = e.target._map;
                map.fitBounds(e.target.getBounds());
            },
        });
    };

    return (
        <MapContainer
            center={[6.42375, -66.58973]}
            zoom={6}
            minZoom={1}
            maxZoom={19}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                // CartoDB Positron tiles (light and minimalistic)
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {geoData && <GeoJSON data={geoData} />}

        </MapContainer>
    );
};

export default Map;