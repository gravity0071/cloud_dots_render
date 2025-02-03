import React from 'react';
import FileUpload from './components/FileUpload';
import GISViewer from './components/GISViewer';
import PointCloudViewer from './components/PointCloudViewer';
import './App.css';

function App() {
  return (
      <div className="container">
        <aside>
          <h3>Upload Files</h3>
          <FileUpload />
        </aside>
        <main>
          <div className="viewer-tabs">
            <GISViewer />
            <PointCloudViewer />
          </div>
        </main>
      </div>
  );
}

export default App;