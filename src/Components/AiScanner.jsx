import React, { useState, useRef } from 'react';
import API from '../services/api';
import './AiScanner.css';

export default function AiScanner({ onBookRecommendation }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, RESULT
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setStatus('IDLE');
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setStatus('SCANNING');
    
    try {
      // In a real app, we would send a FormData with the image.
      // Here we just hit our simulation endpoint.
      const res = await API.post('/users/me/ai-scan');
      if (res.data.success) {
        setResult(res.data.aiResult);
        setStatus('RESULT');
      }
    } catch(e) {
      console.error(e);
      setStatus('IDLE');
      alert("Failed to connect to AI engine.");
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setStatus('IDLE');
    setResult(null);
  };

  return (
    <div className="ais-container pp-animate">
      <div className="ais-header">
        <div className="ais-icon-wrap">
          <i className="ti ti-brain" />
        </div>
        <div>
          <h2 className="ais-title">TOOTHEASE AI Vision</h2>
          <p className="ais-subtitle">Upload a photo of your teeth for an instant preliminary diagnosis powered by AI.</p>
        </div>
      </div>

      {!preview ? (
        <div 
          className="ais-upload-zone" 
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept="image/*" 
            hidden 
            ref={fileInputRef} 
            onChange={handleImageChange}
          />
          <div className="ais-upload-icon"><i className="ti ti-camera" /></div>
          <h3>Take or Upload a Photo</h3>
          <p>Ensure good lighting and focus on the affected area.</p>
        </div>
      ) : (
        <div className="ais-content">
          <div className="ais-image-wrapper">
            <img src={preview} alt="Dental scan" className="ais-preview-img" />
            
            {status === 'SCANNING' && (
              <div className="ais-scanner-overlay">
                <div className="ais-laser-line"></div>
                <div className="ais-scan-grid"></div>
                <div className="ais-analyzing-text">ANALYZING DENTITION...</div>
              </div>
            )}
          </div>

          <div className="ais-panel">
            {status === 'IDLE' && (
              <div className="ais-idle-panel">
                <button className="ais-btn-primary" onClick={handleScan}>
                  <i className="ti ti-scan" /> Analyze Image
                </button>
                <button className="ais-btn-ghost" onClick={reset}>
                  Use Different Photo
                </button>
              </div>
            )}

            {status === 'SCANNING' && (
              <div className="ais-scanning-panel">
                <div className="ais-spinner"></div>
                <p>Connecting to AI Core...</p>
              </div>
            )}

            {status === 'RESULT' && result && (
              <div className="ais-result-panel pp-animate">
                <div className="ais-result-header">
                  <h3>Diagnosis Results</h3>
                  <span className={`ais-severity-badge ais-sev-${result.severity.toLowerCase()}`}>
                    {result.severity} Severity
                  </span>
                </div>

                <div className="ais-result-metric">
                  <div className="ais-metric-label">
                    <span>{result.diagnosis}</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{result.confidence}%</span>
                  </div>
                  <div className="ais-progress-bar">
                    <div className="ais-progress-fill" style={{ width: `${result.confidence}%` }}></div>
                  </div>
                </div>

                <div className="ais-result-details">
                  <p>{result.details}</p>
                </div>

                <div className="ais-recommendation">
                  <strong>Recommended Action:</strong>
                  <p>{result.recommendation}</p>
                </div>

                <div className="ais-actions">
                  {result.recommendation !== 'None' && (
                    <button 
                      className="ais-btn-primary"
                      onClick={() => onBookRecommendation(result.recommendation)}
                    >
                      <i className="ti ti-calendar-plus" /> Book {result.recommendation}
                    </button>
                  )}
                  <button className="ais-btn-ghost" onClick={reset}>Scan Another</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
