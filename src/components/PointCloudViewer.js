import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

function PointCloudViewer() {
    const viewerRef = useRef(null);
    const [pointCloud, setPointCloud] = useState(null);

    const handlePointCloudUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            loadPCD(url);
        }
    };

    const loadPCD = (fileUrl) => {
        if (!viewerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, viewerRef.current.clientWidth / viewerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 2);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
        viewerRef.current.innerHTML = '';
        viewerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const light = new THREE.AmbientLight(0xffffff);
        scene.add(light);

        const loader = new PCDLoader();
        loader.load(fileUrl, (points) => {
            scene.add(points);
            setPointCloud(points);
            animate();
        });

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();
    };

    return (
        <div>
            <input type="file" accept=".pcd,.xyz" onChange={handlePointCloudUpload} />
            <div ref={viewerRef} style={{ height: "400px", width: "100%" }}></div>
        </div>
    );
}

export default PointCloudViewer;