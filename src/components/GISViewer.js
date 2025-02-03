import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function GISViewer() {
    const [gisData, setGisData] = useState(null);

    const handleGisUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setGisData(JSON.parse(e.target.result));
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <input type="file" accept=".json" onChange={handleGisUpload} />
            {gisData && (
                <MapContainer center={[0.5, 102.0]} zoom={5} style={{ height: "100vh", width: "100%" }}>
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
