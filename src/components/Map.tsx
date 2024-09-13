// components/Map.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import L, { PathOptions, StyleFunction } from 'leaflet';

const Map: React.FC = () => {
    const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
    const [highlightedStates, setHighlightedStates] = useState<Set<string>>(new Set());



    // Fetch the GeoJSON data
    useEffect(() => {
        const fetchGeoJSON = async () => {
            try {
                const response = await fetch('/ve.json');
                const data = await response.json();
                setGeoData(data);
            } catch (error) {
                console.error('Error fetching GeoJSON data:', error);
            }
        };

        fetchGeoJSON();
    }, []);

    // Determine which states contain the coordinates
    useEffect(() => {
        if (!geoData) return;

        const statesWithPoints = new Set<string>();
        const coordinatesArray = [
            { lat: 10.4806, lng: -66.9036 }, // Example coordinate in Caracas
            { lat: 8.5933, lng: -71.1448 },  // Another coordinate
            // ... more coordinates
        ];

        // Convert coordinatesArray to Turf.js points
        const points = coordinatesArray.map((point) =>
            turf.point([point.lng, point.lat])
        );

        // Loop through each state (feature) in the GeoJSON data
        geoData.features.forEach((feature) => {
            const stateName = feature.properties?.name; // Adjust based on your GeoJSON properties

            // Create a Turf.js polygon from the feature
            const polygon = feature as Feature<Polygon>;

            // Check if any of the points are inside this polygon
            for (const pt of points) {
                if (turf.booleanPointInPolygon(pt, polygon)) {
                    if (stateName) {
                        statesWithPoints.add(stateName);
                    }
                    break; // If one point is inside, no need to check the rest
                }
            }
        });

        setHighlightedStates(statesWithPoints);
    }, [geoData]);



    // Style function for GeoJSON layer

    const styleFeature = useCallback<StyleFunction>((feature) => {
        // Define styles
        const defaultStyle: PathOptions = {
            color: '#3388ff',
            weight: 2,
            opacity: 1,
            fillColor: '#6baed6',
            fillOpacity: 0.5,
        };

        const highlightStyle: PathOptions = {
            color: '#228B22',
            weight: 2,
            opacity: 1,
            fillColor: '#32CD32',
            fillOpacity: 0.7,
        };
        if (!feature) {
            return defaultStyle;
        }

        const isHovered = feature.properties.isHovered;
        const stateName = feature.properties.name as string;

        if (isHovered) {
            const baseStyle = highlightedStates.has(stateName) ? highlightStyle : defaultStyle;
            return {
                ...baseStyle,
                weight: 5,
                color: '#666',
                fillOpacity: 0.7,
            };
        } else if (stateName && highlightedStates.has(stateName)) {
            return highlightStyle;
        } else {
            return defaultStyle;
        }
    }, [highlightedStates]);

    // Event handlers for each feature
    const onEachFeature = (feature: any, layer: any) => {
        const stateName = feature.properties?.name as string;
        if (stateName) {
            layer.bindTooltip(stateName);
        }

        layer.on({
            mouseover: (e: any) => {
                const target = e.target;
                target.feature.properties.isHovered = true;
                console.log("THIS WORKS", target.feature)
                target.setStyle(styleFeature(target.feature));
            },
            mouseout: (e: any) => {
                const target = e.target;
                target.feature.properties.isHovered = false;
                target.setStyle(styleFeature(target.feature));
            },
            click: (e: any) => {
                const map = e.target._map;
                map.fitBounds(e.target.getBounds());
            },
        });
    };


    if (highlightedStates.size == 0) {
        return <div>Cargando Mapa...</div>;
    }

    return (
        <MapContainer
            center={[6.42375, -66.58973]}
            zoom={6}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            {geoData && (
                <GeoJSON
                    data={geoData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                />
            )}
        </MapContainer>
    );
};

export default Map;