import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import L, { PathOptions, StyleFunction } from 'leaflet';
const MUNICIPALITIES_BASE_URL = '/geo_json_venezuela/municipios/municipios_estado_';
const Map: React.FC = () => {
    const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
    const [highlightedStates, setHighlightedStates] = useState<Set<string>>(new Set());
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [municipalitiesData, setMunicipalitiesData] = useState<FeatureCollection | null>(null);
    const [currentZoom, setCurrentZoom] = useState<number>(6);
    // Fetch the States GeoJSON data
    useEffect(() => {
        const fetchGeoJSON = async () => {
            try {
                const response = await fetch('/geo_json_venezuela/estados/ESTADOSC4V.json');
                const data: FeatureCollection = await response.json();
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
            { lat: 8.5933, lng: -71.1448 }, // Another coordinate
            // ... more coordinates
        ];
        // Convert coordinatesArray to Turf.js points
        const points = coordinatesArray.map((point) =>
            turf.point([point.lng, point.lat])
        );
        // Loop through each state (feature) in the GeoJSON data
        geoData.features.forEach((feature) => {
            const stateName = feature.properties?.NAME; // Adjust based on your GeoJSON properties
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
    // Fetch Municipalities GeoJSON data based on selectedStateId
    useEffect(() => {
        console.log("selectedStateId", selectedStateId)
        if (selectedStateId === null) {
            setMunicipalitiesData(null);
            return;
        }
        const fetchMunicipalities = async () => {
            try {
                const response = await fetch(`${MUNICIPALITIES_BASE_URL}${selectedStateId}.json`);
                const data: FeatureCollection = await response.json();
                setMunicipalitiesData(data);
                setGeoData(null);
            } catch (error) {
                console.error('Error fetching Municipalities GeoJSON data:', error);
            }
        };
        fetchMunicipalities();
    }, [selectedStateId]);
    const styleFeature = useCallback<StyleFunction>((feature) => {
        // Define styles
        console.log("ThIS is running", feature)
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
        const hoverStyle: PathOptions = {
            weight: 5,
            color: '#666',
            fillOpacity: 0.7,
        };
        const getBaseStyle = (stateName: string): PathOptions =>
            highlightedStates.has(stateName) ? highlightStyle : defaultStyle;
        const getHoverStyle = (baseStyle: PathOptions): PathOptions => ({
            ...baseStyle,
            ...hoverStyle,
        });
        if (!feature) return defaultStyle;
        const { isHovered, NAME: stateName } = feature.properties;
        if (isHovered) {
            return getHoverStyle(getBaseStyle(stateName));
        } else if (stateName && highlightedStates.has(stateName)) {
            return highlightStyle;
        } else {
            return defaultStyle;
        }
    }, [highlightedStates]);
    // Event handlers for each feature
    const onEachFeature = useCallback((feature: any, layer: any) => {
        const stateName = feature.properties?.NAME as string;
        const objectId = feature.properties?.OBJECTID as number;
        if (stateName) {
            layer.bindTooltip(stateName);
        }
        layer.on({
            mouseover: (e: any) => {
                const target = e.target;
                target.feature.properties.isHovered = true;
                target.setStyle(styleFeature(target.feature));
            },
            mouseout: (e: any) => {
                const target = e.target;
                target.feature.properties.isHovered = false;
                target.setStyle(styleFeature(target.feature));
            },
            click: (e: any) => {
                const map = e.target._map;
                console.log("seeting state id", objectId)
                setSelectedStateId(objectId);
            },
        });
    }, [styleFeature]);
    // Handle map clicks outside features
    // const MapClickHandler: React.FC = () => {
    //     useMapEvents({
    //         click: (e) => {
    //             // Deselect state if click occurs on the map (not on a feature)
    //             console.log("this is being called")
    //             setSelectedStateId(null);
    //         },
    //         zoomend: (e) => {
    //             const map = e.target;
    //             const newZoom = map.getZoom();
    //             setCurrentZoom(newZoom);
    //             // Define a zoom threshold for switching layers
    //             const zoomThreshold = 10; // Adjust as needed
    //             if (selectedStateId === null && newZoom >= zoomThreshold) {
    //                 // Optionally, handle auto-selection based on zoom
    //                 // For simplicity, this example does not auto-select a state
    //             }
    //         },
    //     });
    //     return null;
    // };
    // Conditional rendering based on selectedStateId

    // Event handlers for municipalities features (if any)
    const onEachMunicipalityFeature = useCallback((feature: any, layer: any) => {
        console.log("Municipality Feature", feature);
        const municipalityName = feature.properties?.MUNICIPIO as string;
        if (municipalityName) {
            layer.bindTooltip(municipalityName);
        }
        layer.on({
            mouseover: (e: any) => {
                const target = e.target;
                target.feature.properties.isHovered = true;
                target.setStyle({
                    weight: 5,
                    color: '#FF5733',
                    fillOpacity: 0.7,
                });
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
    }, [styleFeature]);

    const [statesLayerGroup, setStatesLayerGroup] = useState<L.LayerGroup | null>(null);
    const [municipalitiesLayerGroup, setMunicipalitiesLayerGroup] = useState<L.LayerGroup | null>(null);

    const onMapLoad = (map: L.Map) => {
        const newStatesLayerGroup = L.layerGroup().addTo(map);
        const newMunicipalitiesLayerGroup = L.layerGroup().addTo(map);
        setStatesLayerGroup(newStatesLayerGroup);
        setMunicipalitiesLayerGroup(newMunicipalitiesLayerGroup);
    };

    useEffect(() => {
        if (!geoData || !statesLayerGroup) return;

        statesLayerGroup.clearLayers(); // Clear previous layers

        L.geoJSON(geoData, {
            style: styleFeature,
            onEachFeature: onEachFeature,
        }).addTo(statesLayerGroup);
    }, [geoData, onEachFeature, statesLayerGroup, styleFeature]);

    useEffect(() => {
        if (!municipalitiesData || !municipalitiesLayerGroup) return;

        municipalitiesLayerGroup.clearLayers(); // Clear previous layers

        L.geoJSON(municipalitiesData, {
            style: styleFeature,
            onEachFeature: onEachMunicipalityFeature,
        }).addTo(municipalitiesLayerGroup);
    }, [municipalitiesData, municipalitiesLayerGroup, onEachMunicipalityFeature, styleFeature]);

    if (!geoData && !municipalitiesData) {
        return <div>Cargando Mapa...</div>;
    }


    return (
        <>
            <p>
                This is the value: {selectedStateId && !!municipalitiesData ? "true" : "false"}
            </p>
            <MapContainer
                center={[6.42375, -66.58973]}
                zoom={6}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                {/* States Layer */}
                {selectedStateId === null && geoData && (
                    <GeoJSON
                        data={geoData}
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />
                )}
                {/* Municipalities Layer */}
                {selectedStateId !== null && municipalitiesData && (
                    <GeoJSON
                        data={municipalitiesData}
                        style={styleFeature}
                        onEachFeature={onEachMunicipalityFeature}
                    />
                )}
            </MapContainer>
        </>

    );
};
export default Map;