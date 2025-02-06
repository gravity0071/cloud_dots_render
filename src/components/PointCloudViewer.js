import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import './PointCloudViewer.css';

function PointCloudViewer({ file, hasZAxis }) {
    const viewerRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);

    useEffect(() => {
        if (!viewerRef.current) return;

        const camera = new THREE.PerspectiveCamera(75, viewerRef.current.clientWidth / viewerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(1, 1, 1);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        viewerRef.current.innerHTML = '';
        viewerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        const light = new THREE.AmbientLight(0xffffff, 1.0);
        sceneRef.current.add(light);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(sceneRef.current, camera);
        };
        animate();

        return () => {
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            loadPCD(url);
        }
    }, [file]);

    const loadPCD = (fileUrl) => {
        if (!viewerRef.current) return;

        while (sceneRef.current.children.length > 0) {
            sceneRef.current.remove(sceneRef.current.children[0]);
        }

        const loader = new PCDLoader();
        loader.load(fileUrl, (points) => {
            optimizePointCloud(points);
            if(hasZAxis)
                colorByAltitude(points);
            sceneRef.current.add(points);
        });
    };

    const optimizePointCloud = (points) => {
        points.geometry.computeBoundingSphere(); //The sphere helps determine visibility quickly instead of checking each point.
        points.frustumCulled = true; //avoid rendering unnecessary points. Skips rendering when off-screen
        points.geometry.attributes.position.usage = THREE.DynamicDrawUsage;
    };

    const colorByAltitude = (points) => {
        const geometry = points.geometry;
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let i = 2; i < positions.length; i += 3) {
            minZ = Math.min(minZ, positions[i]);
            maxZ = Math.max(maxZ, positions[i]);
        }

        if (minZ === maxZ) maxZ = minZ + 1;

        for (let i = 2; i < positions.length; i += 3) {
            const normalizedZ = (positions[i] - minZ) / (maxZ - minZ);
            colors[i - 2] = normalizedZ;
            colors[i - 1] = 0;
            colors[i] = 1.0 - normalizedZ;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        points.material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
    };

    return <div className="pointcloud-viewer" ref={viewerRef}></div>;
}

export default PointCloudViewer;
