const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/Pages/Doctor/ApiDoctorPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Pass onStartCall={setCall} to DocAppointments
content = content.replace(
  '<DocAppointments {...sp}/>',
  '<DocAppointments {...sp} onStartCall={setCall}/>'
);

// 2. Add onStartCall prop to DocAppointments function
content = content.replace(
  'function DocAppointments({toast}){',
  'function DocAppointments({toast,onStartCall}){'
);

// 3. Modify the PENDING and CONFIRMED actions
const oldAction = '<td>{a.status?.toUpperCase()==="PENDING"&&<><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>up(a.id||a._id,"CONFIRMED")}>Confirm</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(a.id||a._id,"CANCELLED")}>Cancel</button></>}{a.status?.toUpperCase()==="CONFIRMED"&&<button className="dp-ghost" style={{color:"#1e88e5"}} onClick={()=>up(a.id||a._id,"COMPLETED")}>Done</button>}</td>';

const newAction = '<td>{a.status?.toUpperCase()==="PENDING"&&<><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>{up(a.id||a._id,"CONFIRMED");if(a.healthType==="Video Consultation"||a.isVideoConsultation)onStartCall(a);}}>Confirm</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(a.id||a._id,"CANCELLED")}>Cancel</button></>}{a.status?.toUpperCase()==="CONFIRMED"&&<>{(a.healthType==="Video Consultation"||a.isVideoConsultation)&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12,marginRight:6}} onClick={()=>onStartCall(a)}>Join</button>}<button className="dp-ghost" style={{color:"#1e88e5"}} onClick={()=>up(a.id||a._id,"COMPLETED")}>Done</button></>}</td>';

content = content.replace(oldAction, newAction);

fs.writeFileSync(filePath, content);
console.log('Updated DocAppointments to handle video calls.');
