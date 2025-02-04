import React, { useState } from "react";
import GISViewer from "./GISViewer";
import PointCloudViewer from "./PointCloudViewer";
import "./Index.css";

function Index() {
    const [files, setFiles] = useState([]);
    const [gisFile, setGisFile] = useState(null);
    const [pointCloudFile, setPointCloudFile] = useState(null);

    const parsePCDFile = async (file) => {
        const text = await file.text();
        const lines = text.split("\n").map(line => line.trim()).filter(line => line);

        let startIndex = 0;
        let numPoints = 0;
        let fieldNames = [];
        let isBinary = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith("FIELDS")) {
                fieldNames = line.split(/\s+/).slice(1); // Extract field names
            }

            if (line.startsWith("POINTS")) {
                numPoints = parseInt(line.split(/\s+/)[1], 10); // Extract number of points
            }

            if (line.startsWith("DATA")) {
                if (line.includes("binary")) {
                    isBinary = true;
                }
                startIndex = i + 1;
                break;
            }
        }

        if (startIndex === 0) {
            console.error("Invalid or unsupported PCD file format.");
            return { numPoints: 0, boundingBox: {} };
        }

        if (isBinary) {
            return parseBinaryPCD(file, numPoints, fieldNames);
        } else {
            return parseAsciiPCD(lines.slice(startIndex));
        }
    };

    const parseAsciiPCD = (dataLines) => {
        const points = dataLines.map(line => {
            const values = line.split(/\s+/).map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            });

            if (values.length >= 3 && values.every(v => v !== null)) {
                return { x: values[0], y: values[1], z: values[2] };
            }
            return null;
        }).filter(point => point !== null);

        if (points.length === 0) {
            console.error("No valid points found in ASCII PCD file.");
            return { numPoints: 0, boundingBox: {} };
        }

        return computeBoundingBox(points);
    };

    const parseBinaryPCD = async (file, numPoints, fieldNames) => {
        const arrayBuffer = await file.arrayBuffer();
        const dataView = new DataView(arrayBuffer);

        // Find the start of binary data by scanning for the first zero-byte gap
        let offset = 0;
        for (let i = 0; i < arrayBuffer.byteLength; i++) {
            if (dataView.getUint8(i) === 0x0A && dataView.getUint8(i + 1) !== 0) {
                offset = i + 1; // Start reading data after the last metadata newline
                break;
            }
        }

        if (offset === 0) {
            console.error("Binary PCD file: Could not determine data start.");
            return { numPoints: 0, boundingBox: {} };
        }

        // Get correct byte offsets for x, y, z based on `FIELDS`
        const xIndex = fieldNames.indexOf("x");
        const yIndex = fieldNames.indexOf("y");
        const zIndex = fieldNames.indexOf("z");

        if (xIndex === -1 || yIndex === -1 || zIndex === -1) {
            console.error("PCD file missing x, y, z fields.");
            return { numPoints: 0, boundingBox: {} };
        }

        const bytesPerPoint = fieldNames.length * 4; // Each field is 4 bytes (Float32)
        const points = [];

        // Read each point correctly
        for (let i = 0; i < numPoints; i++) {
            const pointOffset = offset + i * bytesPerPoint;
            const x = dataView.getFloat32(pointOffset + xIndex * 4, true);
            const y = dataView.getFloat32(pointOffset + yIndex * 4, true);
            const z = dataView.getFloat32(pointOffset + zIndex * 4, true);
            points.push({ x, y, z });
        }

        return computeBoundingBox(points);
    };

    const computeBoundingBox = (points) => {
        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);
        const zValues = points.map(p => p.z);

        return {
            numPoints: points.length,
            boundingBox: {
                minX: parseFloat(Math.min(...xValues).toFixed(4)),
                maxX: parseFloat(Math.max(...xValues).toFixed(4)),
                minY: parseFloat(Math.min(...yValues).toFixed(4)),
                maxY: parseFloat(Math.max(...yValues).toFixed(4)),
                minZ: parseFloat(Math.min(...zValues).toFixed(4)),
                maxZ: parseFloat(Math.max(...zValues).toFixed(4))
            }
        };
    };

    const handleFileUpload = async (event) => {
        const uploadedFiles = await Promise.all(Array.from(event.target.files).map(async file => {
            let additionalInfo = {};

            if (file.name.endsWith(".pcd")) {
                const stats = await parsePCDFile(file);
                setPointCloudFile(file);
                setGisFile(null);
                additionalInfo = stats;
            } else if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
                setGisFile(file);
                setPointCloudFile(null);
            }

            return {
                name: file.name,
                size: file.size,
                type: file.type,
                ...additionalInfo
            };
        }));

        setFiles(uploadedFiles);
    };

    return (
        <div className="container">
            <aside>
                <h3>Upload Files</h3>
                <input type="file" multiple accept=".json,.geojson,.pcd" onChange={handleFileUpload} />
                <ul>
                    {files.map((file, index) => (
                        <li key={index}>
                            <strong>{file.name}</strong> - {file.size} bytes
                            {file.numPoints !== undefined && (
                                <ul>
                                    <li>Number of Points: {file.numPoints}</li>
                                    <li>Bounding Box:<br/>
                                        X[{file.boundingBox.minX}, {file.boundingBox.maxX}]<br/><br/>
                                        Y[{file.boundingBox.minY}, {file.boundingBox.maxY}]<br/><br/>
                                        Z[{file.boundingBox.minZ}, {file.boundingBox.maxZ}]
                                    </li>
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </aside>
            <main>
                <div className="viewer-tabs">
                    {gisFile && <GISViewer file={gisFile} />}
                    {pointCloudFile && <PointCloudViewer file={pointCloudFile} />}
                </div>
            </main>
        </div>
    );
}

export default Index;