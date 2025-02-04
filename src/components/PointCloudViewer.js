import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import "./PointCloudViewer.css";

function PointCloudViewer({ file }) {
    const viewerRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const rendererRef = useRef(null);
    const [pointCloud, setPointCloud] = useState(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            loadPCD(url);
        }
    }, [file]); // Re-run when `file` changes

    const loadPCD = (fileUrl) => {
        if (!viewerRef.current) return;

        // Clear previous scene
        while (sceneRef.current.children.length > 0) {
            sceneRef.current.remove(sceneRef.current.children[0]);
        }

        const camera = new THREE.PerspectiveCamera(
            75,
            viewerRef.current.clientWidth / viewerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 2);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
        viewerRef.current.innerHTML = '';
        viewerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const light = new THREE.AmbientLight(0xffffff);
        sceneRef.current.add(light);

        const loader = new PCDLoader();
        loader.load(fileUrl, (points) => {
            colorByAltitude(points);
            sceneRef.current.add(points);
            setPointCloud(points);
            animate();
        });

        const colorByAltitude = (points) => {
            const geometry = points.geometry;
            const positions = geometry.attributes.position.array;
            const colors = new Float32Array(positions.length);

            let minZ = Infinity;
            let maxZ = -Infinity;

            // Compute min/max Z values
            for (let i = 2; i < positions.length; i += 3) {
                minZ = Math.min(minZ, positions[i]);
                maxZ = Math.max(maxZ, positions[i]);
            }

            // Handle edge case where all Z values are equal
            if (minZ === maxZ) maxZ = minZ + 1;

            // Assign colors based on altitude
            for (let i = 2; i < positions.length; i += 3) {
                const normalizedZ = (positions[i] - minZ) / (maxZ - minZ);
                const r = normalizedZ;
                const g = 1.0 - normalizedZ;
                const b = 0.5;
                colors[i - 2] = r;
                colors[i - 1] = g;
                colors[i] = b;
            }

            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            points.material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
        };

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(sceneRef.current, camera);
        };
        animate();
    };

    return <div className="pointcloud-viewer" ref={viewerRef}></div>;
}

export default PointCloudViewer;