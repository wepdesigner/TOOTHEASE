import React, { useState } from 'react';
import './DentalChart.css';

const upperRight = [18,17,16,15,14,13,12,11];
const upperLeft = [21,22,23,24,25,26,27,28];
const lowerRight = [48,47,46,45,44,43,42,41];
const lowerLeft = [31,32,33,34,35,36,37,38];

const getToothStatus = (toothId, records) => {
  // Sort records descending to get the most recent condition
  const toothRecs = records.filter(r => r.toothId === String(toothId)).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  return toothRecs.length > 0 ? toothRecs[0] : null;
};

const getToothStyle = (status) => {
  if (!status) return {};
  switch(status.condition) {
    case 'Cavity': return { borderColor: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239,68,68,0.2)' };
    case 'Crown': return { background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', color: '#fff', border: 'none' };
    case 'Extracted': return { opacity: 0.2, border: '1px dashed #94a3b8', background: 'transparent', boxShadow: 'none' };
    case 'Implant': return { background: 'linear-gradient(135deg, #cbd5e1, #64748b)', color: '#fff', border: 'none' };
    case 'Filling': return { background: 'radial-gradient(circle at center, #94a3b8 30%, transparent 35%)' };
    case 'Root Canal': return { borderColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' };
    case 'Veneer': return { background: '#f8fafc', border: '1px solid #38bdf8', boxShadow: '0 0 15px rgba(56,189,248,0.3)' };
    default: return {};
  }
};

export default function DentalChart({ records = [], readOnly = true, onToothClick }) {
  const [hoveredTooth, setHoveredTooth] = useState(null);

  const renderTooth = (toothId, isUpper) => {
    const status = getToothStatus(toothId, records);
    const style = getToothStyle(status);
    
    return (
      <div 
        key={toothId} 
        className={`dc-tooth ${isUpper ? 'dc-tooth-upper' : 'dc-tooth-lower'} ${readOnly ? '' : 'dc-tooth-interactive'}`}
        style={style}
        onClick={() => !readOnly && onToothClick && onToothClick(toothId, status)}
        onMouseEnter={() => setHoveredTooth(toothId)}
        onMouseLeave={() => setHoveredTooth(null)}
      >
        <span className="dc-tooth-num">{toothId}</span>
        {hoveredTooth === toothId && status && (
          <div className={`dc-tooltip ${isUpper ? 'dc-tooltip-bottom' : 'dc-tooltip-top'}`}>
            <strong>{status.condition}</strong>
            {status.notes && <p>{status.notes}</p>}
            <span className="dc-date">{new Date(status.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dc-container">
      <div className="dc-arch">
        <div className="dc-arch-label">Upper Jaw (Maxillary)</div>
        <div className="dc-row">
          <div className="dc-quadrant dc-right-quad">
            {upperRight.map(id => renderTooth(id, true))}
          </div>
          <div className="dc-divider"></div>
          <div className="dc-quadrant dc-left-quad">
            {upperLeft.map(id => renderTooth(id, true))}
          </div>
        </div>
      </div>

      <div className="dc-arch" style={{ marginTop: 40 }}>
        <div className="dc-row">
          <div className="dc-quadrant dc-right-quad">
            {lowerRight.map(id => renderTooth(id, false))}
          </div>
          <div className="dc-divider"></div>
          <div className="dc-quadrant dc-left-quad">
            {lowerLeft.map(id => renderTooth(id, false))}
          </div>
        </div>
        <div className="dc-arch-label" style={{ marginTop: 16 }}>Lower Jaw (Mandibular)</div>
      </div>
      
      <div className="dc-legend">
        <div className="dc-legend-item"><div className="dc-legend-color" style={{borderColor: '#ef4444'}}></div> Cavity</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{background: 'linear-gradient(135deg, #fcd34d, #f59e0b)'}}></div> Crown</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{opacity: 0.2, border: '1px dashed #94a3b8'}}></div> Extracted</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{background: 'linear-gradient(135deg, #cbd5e1, #64748b)'}}></div> Implant</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{background: 'radial-gradient(circle at center, #94a3b8 30%, transparent 35%)', border: '1px solid #cbd5e1'}}></div> Filling</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{borderColor: '#8b5cf6'}}></div> Root Canal</div>
        <div className="dc-legend-item"><div className="dc-legend-color" style={{borderColor: '#38bdf8'}}></div> Veneer</div>
      </div>
    </div>
  );
}
