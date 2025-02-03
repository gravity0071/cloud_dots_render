import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

function App() {
  const [gisData, setGisData] = useState(null);
  const [pointCloudData, setPointCloudData] = useState(null);
  const viewerRef = useRef(null);

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

  const handlePointCloudUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const points = e.target.result.split('\n').map(line => {
          const [x, y, z] = line.split(' ').map(Number);
          return { x, y, z };
        }).filter(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z));
        setPointCloudData(points);
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (pointCloudData && viewerRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, viewerRef.current.clientWidth / viewerRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
      viewerRef.current.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(pointCloudData.flatMap(p => [p.x, p.y, p.z]));
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

      const material = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.05 });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    }
  }, [pointCloudData]);

  return (
      <div className="container">
        <aside>
          <h3>Upload Files</h3>
          <input type="file" accept=".geojson" onChange={handleGisUpload} />
          <input type="file" accept=".xyz,.pcd" onChange={handlePointCloudUpload} />
        </aside>
        <main>
          {gisData && (
              <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "400px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {gisData.features && gisData.features.map((feature, index) => (
                    <Marker key={index} position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}>
                      <Popup>
                        {feature.properties && feature.properties.name}
                      </Popup>
                    </Marker>
                ))}
              </MapContainer>
          )}
          {pointCloudData && (
              <div id="3d-viewer" ref={viewerRef} style={{ height: "400px", width: "100%" }}></div>
          )}
        </main>
      </div>
  );
}

export default App;
