import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function GISViewer({ file }) {
    const [gisData, setGisData] = useState(null);

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsedData = JSON.parse(e.target.result);
                    setGisData(parsedData);
                } catch (error) {
                    console.error("Error parsing GeoJSON file:", error);
                }
            };
            reader.readAsText(file);
        } else {
            setGisData(null);
        }
    }, [file]);

    return (
        <div>
            {gisData && (
                <MapContainer
                    key={JSON.stringify(gisData)}
                    center={[0.5, 102.0]}
                    zoom={5}
                    style={{ height: "100vh", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {gisData.features?.map((feature, index) => {
                        const { geometry, properties } = feature;
                        if (!geometry) return null;

                        switch (geometry.type) {
                            case "Point":
                                return (
                                    <Marker key={index} position={[geometry.coordinates[1], geometry.coordinates[0]]}>
                                        <Popup>{JSON.stringify(properties, null, 2)}</Popup>
                                    </Marker>
                                );
                            case "LineString":
                                return (
                                    <Polyline key={index} positions={geometry.coordinates.map(coord => [coord[1], coord[0]])} color="blue">
                                        <Popup>{JSON.stringify(properties, null, 2)}</Popup>
                                    </Polyline>
                                );
                            case "Polygon":
                                return (
                                    <Polygon key={index} positions={geometry.coordinates[0].map(coord => [coord[1], coord[0]])} color="green">
                                        <Popup>{JSON.stringify(properties, null, 2)}</Popup>
                                    </Polygon>
                                );
                            default:
                                return null;
                        }
                    })}
                </MapContainer>
            )}
        </div>
    );
}

export default GISViewer;