import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './RecoveryMonitor.css';

export default function RecoveryMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    procedureName: 'Wisdom Tooth Extraction',
    dayNumber: 1,
    painLevel: 1,
    notes: ''
  });

  const fetchLogs = async () => {
    try {
      const res = await API.get('/users/me/post-op-logs');
      if (res.data.success) {
        setLogs(res.data.postOpLogs);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/users/me/post-op-logs', form);
      if (res.data.success) {
        if (res.data.sosTriggered) {
          alert("CRITICAL PAIN DETECTED: An SOS Alert has been instantly sent to your doctor! They will contact you shortly.");
        } else {
          alert("Log submitted successfully. Your doctor is monitoring your recovery.");
        }
        setForm({ ...form, dayNumber: form.dayNumber + 1, painLevel: 1, notes: '' });
        fetchLogs();
      }
    } catch (err) {
      alert("Failed to submit log.");
    }
  };

  const getPainColor = (level) => {
    if (level <= 3) return '#22c55e'; // green
    if (level <= 7) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="rm-container pp-animate">
      <div className="rm-header">
        <h1>Post-Op Recovery Monitor</h1>
        <p>Track your daily healing process. High pain levels will automatically alert your doctor.</p>
      </div>

      <div className="rm-content">
        <div className="rm-form-card">
          <h3>Log Today's Recovery</h3>
          <form onSubmit={handleSubmit}>
            <div className="rm-field">
              <label>Procedure</label>
              <input 
                type="text" 
                value={form.procedureName} 
                onChange={e => setForm({...form, procedureName: e.target.value})} 
                required
              />
            </div>
            
            <div className="rm-field">
              <label>Day Number</label>
              <input 
                type="number" 
                min="1" 
                max="30"
                value={form.dayNumber} 
                onChange={e => setForm({...form, dayNumber: parseInt(e.target.value)})} 
                required
              />
            </div>

            <div className="rm-field rm-slider-field">
              <label>Pain Level (1-10)</label>
              <div className="rm-pain-display" style={{ color: getPainColor(form.painLevel) }}>
                {form.painLevel} {form.painLevel >= 8 && <span className="rm-sos-badge">SOS RISK</span>}
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={form.painLevel} 
                onChange={e => setForm({...form, painLevel: parseInt(e.target.value)})} 
              />
              <div className="rm-slider-labels">
                <span>No Pain (1)</span>
                <span>Unbearable (10)</span>
              </div>
            </div>

            <div className="rm-field">
              <label>Notes & Symptoms</label>
              <textarea 
                placeholder="Swelling, bleeding, etc..."
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>

            <button type="submit" className={`rm-submit-btn ${form.painLevel >= 8 ? 'rm-btn-danger' : ''}`}>
              {form.painLevel >= 8 ? "Send SOS Alert" : "Submit Daily Log"}
            </button>
          </form>
        </div>

        <div className="rm-history">
          <h3>Your Recovery History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : logs.length === 0 ? (
            <div className="rm-empty">No logs yet. Start tracking your recovery!</div>
          ) : (
            <div className="rm-log-list">
              {logs.map(log => (
                <div key={log._id} className={`rm-log-item ${log.sosTriggered ? 'rm-log-critical' : ''}`}>
                  <div className="rm-log-header">
                    <span className="rm-log-day">Day {log.dayNumber}</span>
                    <span className="rm-log-date">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="rm-log-body">
                    <div className="rm-log-pain" style={{ color: getPainColor(log.painLevel) }}>
                      Pain: {log.painLevel}/10
                    </div>
                    {log.notes && <p className="rm-log-notes">"{log.notes}"</p>}
                    {log.sosTriggered && <div className="rm-sos-tag"><i className="ti ti-alert-triangle" /> SOS Triggered</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
