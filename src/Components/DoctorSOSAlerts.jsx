import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './DoctorSOSAlerts.css';

const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({name="?",size=36,src}) {
  if(src) return <img src={src} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>;
  const init=name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"?";
  const color=COLORS[(name?.charCodeAt(0)||0)%COLORS.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.37,flexShrink:0,fontFamily:"'Sora',sans-serif"}}>{init}</div>;
}


export default function DoctorSOSAlerts({ onStartCall }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await API.get('/doctor/sos-logs');
      if (res.data.success) {
        setLogs(res.data.sosLogs);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 10000); // Check for SOS every 10s
    return () => clearInterval(t);
  }, []);

  const handleResolve = async (id) => {
    try {
      const res = await API.patch(`/doctor/sos-logs/${id}/resolve`);
      if (res.data.success) {
        fetchLogs();
      }
    } catch (err) {
      alert("Failed to resolve SOS");
    }
  };

  return (
    <div className="dp-anim" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="dp-page-head" style={{ marginBottom: 24, borderBottom: '2px solid #ef4444', paddingBottom: 16 }}>
        <div>
          <h1 className="dp-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-alert-triangle" /> Post-Op SOS Alerts
          </h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Patients reporting severe post-operative pain or complications. Respond immediately.
          </p>
        </div>
      </div>

      <div className="sos-list">
        {loading ? (
          <p>Loading alerts...</p>
        ) : logs.length === 0 ? (
          <div className="sos-empty">
            <i className="ti ti-check" style={{ fontSize: 40, color: '#22c55e', marginBottom: 12, display: 'block' }} />
            No active SOS alerts. All patients are recovering well!
          </div>
        ) : (
          logs.map(log => (
            <div key={log._id} className="sos-card">
              <div className="sos-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={log.patientId?.name || 'Unknown'} size={48} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{log.patientId?.name || 'Unknown Patient'}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{log.patientId?.email}</p>
                  </div>
                </div>
                <div className="sos-time">
                  Reported: {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="sos-card-body">
                <div className="sos-metric">
                  <span className="sos-label">Procedure</span>
                  <span className="sos-val">{log.procedureName}</span>
                </div>
                <div className="sos-metric">
                  <span className="sos-label">Recovery Day</span>
                  <span className="sos-val">Day {log.dayNumber}</span>
                </div>
                <div className="sos-metric">
                  <span className="sos-label">Pain Level</span>
                  <span className="sos-val" style={{ color: '#ef4444', fontWeight: 800 }}>
                    {log.painLevel} / 10
                  </span>
                </div>
                <div className="sos-metric" style={{ gridColumn: '1 / -1' }}>
                  <span className="sos-label">Patient Notes</span>
                  <span className="sos-val" style={{ fontStyle: 'italic', background: '#f1f5f9', padding: 12, borderRadius: 6, display: 'block' }}>
                    "{log.notes || 'No additional notes provided.'}"
                  </span>
                </div>
              </div>

              <div className="sos-card-actions">
                <button 
                  className="dp-btn-primary" 
                  style={{ background: '#ef4444' }}
                  onClick={() => onStartCall({ patientName: log.patientId?.name, _id: log._id, service: 'Emergency SOS Call' })}
                >
                  <i className="ti ti-video" /> Emergency Video Call
                </button>
                <button 
                  className="dp-ghost"
                  onClick={() => handleResolve(log._id)}
                >
                  <i className="ti ti-check" /> Mark as Resolved
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
