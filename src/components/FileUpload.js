import React, { useState } from 'react';

function FileUpload() {
    const [files, setFiles] = useState([]);

    const parsePointCloudFile = async (file) => {
        const text = await file.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const points = lines.map(line => {
            const [x, y, z] = line.split(/\s+/).map(Number);
            return { x, y, z };
        }).filter(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z));

        const xValues = points.map(p => p.x);
        const yValues = points.map(p => p.y);
        const zValues = points.map(p => p.z);

        return {
            numPoints: points.length,
            boundingBox: {
                minX: Math.min(...xValues),
                maxX: Math.max(...xValues),
                minY: Math.min(...yValues),
                maxY: Math.max(...yValues),
                minZ: Math.min(...zValues),
                maxZ: Math.max(...zValues)
            }
        };
    };

    const handleFileUpload = async (event) => {
        const uploadedFiles = await Promise.all(Array.from(event.target.files).map(async file => {
            let additionalInfo = {};

            if (file.name.endsWith('.xyz') || file.name.endsWith('.pcd')) {
                additionalInfo = await parsePointCloudFile(file);
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
        <div>
            <input type="file" multiple accept=".json,.xyz,.pcd" onChange={handleFileUpload} />
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        <strong>{file.name}</strong> - {file.size} bytes
                        {file.numPoints !== undefined && (
                            <div>
                                <p>Number of Points: {file.numPoints}</p>
                                <p>Bounding Box:
                                    X[{file.boundingBox.minX}, {file.boundingBox.maxX}],
                                    Y[{file.boundingBox.minY}, {file.boundingBox.maxY}],
                                    Z[{file.boundingBox.minZ}, {file.boundingBox.maxZ}]
                                </p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default FileUpload;
