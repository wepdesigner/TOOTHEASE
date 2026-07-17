/**
 * Pages/Doctor/ApiDoctorPanel.jsx
 * ===============================================================
 * API-driven Doctor Portal — mirrors ALL DoctorPanel.jsx
 * functionality but uses the REST API + JitsiVideoCall.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DentalChart from "../../components/DentalChart";
import API from "../../services/api";
import JitsiVideoCall from "../../Components/JitsiVideoCall";
import DoctorSOSAlerts from "../../Components/DoctorSOSAlerts";
import "./DoctorPanel.css";

const fmtMoney = n => Number(n || 0).toLocaleString("fr-CM") + " XAF";
const todayStr = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 10);

const COLORS = ["#1e88e5","#00bfa5","#7c3aed","#f44336","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({name="?",size=36,src}) {
  if(src) return <img src={src} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #e2e8f0"}}/>;
  const init=name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"?";
  const color=COLORS[(name?.charCodeAt(0)||0)%COLORS.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.37,flexShrink:0,fontFamily:"'Sora',sans-serif"}}>{init}</div>;
}
const SC={confirmed:"#22c55e",paid:"#22c55e",completed:"#22c55e",accepted:"#22c55e",pending:"#fbbf24",scheduled:"#fbbf24",cancelled:"#ef4444",declined:"#ef4444",inactive:"#94a3b8"};
function Badge({label,color}){const c=color||SC[label?.toLowerCase()]||"#94a3b8";return<span style={{background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;}
function Modal({title,onClose,children,wide}){useEffect(()=>{const h=e=>e.key==="Escape"&&onClose();window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}><div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:wide?720:480,maxHeight:"90vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.4)",border:"1px solid #e2e8f0"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:"1px solid #e2e8f0"}}><span style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:16}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8"}}>x</button></div><div style={{padding:"18px 22px"}}>{children}</div></div></div>);}
function useToast(){const[t,setT]=useState([]);const fire=(msg,type="success")=>{const id=uid();setT(x=>[...x,{id,msg,type}]);setTimeout(()=>setT(x=>x.filter(x=>x.id!==id)),3200);};return{toasts:t,fire};}
function Toaster({toasts}){return<div style={{position:"fixed",bottom:24,right:24,zIndex:99999,display:"flex",flexDirection:"column",gap:8}}>{toasts.map(t=><div key={t.id} style={{background:t.type==="error"?"#f44336":t.type==="warn"?"#f59e0b":"#22c55e",color:"#fff",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,.3)",minWidth:220}}>{t.msg}</div>)}</div>;}
const inp={background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"9px 13px",width:"100%",fontSize:14,color:"#0f172a",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
function FRow({label,children}){return<div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:.6}}>{label}</label>{children}</div>;}
const NAV=[{section:"Overview"},{key:"overview",icon:"DB",label:"Dashboard"},{section:"Care"},{key:"sos",icon:"AL",label:"SOS Alerts"},{key:"appointments",icon:"AP",label:"Appointments"},{key:"consultations",icon:"VC",label:"Video Calls"},{key:"home_visits",icon:"HV",label:"Home Visits"},{key:"patients",icon:"PT",label:"My Patients"},{section:"Health"},{key:"prescriptions",icon:"RX",label:"Prescriptions"},{key:"records",icon:"MR",label:"Medical Records"},{section:"Account"},{key:"payments",icon:"PA",label:"Payments"},{key:"messages",icon:"MS",label:"Messages"},{key:"notifications",icon:"NT",label:"Notifications"},{key:"profile",icon:"PR",label:"My Profile"}];
export default function ApiDoctorPanel({doctor:propUser,onLogout}) {
  const navigate = useNavigate();
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("stech_session");
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login", { replace: true });
    }
  }, [onLogout, navigate]);

  const su=propUser||{}; const did=su.id||""; const dn=su.name||"Doctor"; const ds=su.specialty||"Specialist"; const da=su.avatar||"";
  const[tab,setTab]=useState("overview");const[side,setSide]=useState(false);const[call,setCall]=useState(null);
  const[ov,setOv]=useState(null);const[load,setLoad]=useState(true);const[err,setErr]=useState("");
  const[pa,setPa]=useState(0);const[un,setUn]=useState(0);const{toasts,fire:toast}=useToast();
  const fetchOv=useCallback(async()=>{try{setErr("");const r=await API.get("/doctor/overview");if(r.data.success)setOv(r.data);}catch(e){console.error(e);setErr(e.response?.data?.message||"Unable to load.");}finally{setLoad(false);}},[]);
  useEffect(()=>{fetchOv();},[fetchOv]);
  const refBadges=useCallback(async()=>{try{const[n,a]=await Promise.allSettled([API.get("/doctor/notifications"),API.get("/doctor/appointments?status=pending")]);if(n.status==="fulfilled"){const notifs=n.value.data.notifications||[];setUn(notifs.filter(x=>!x.isRead&&!x.read).length);}if(a.status==="fulfilled")setPa(a.value.data.appointments?.length||0);}catch{}},[]);
  useEffect(()=>{refBadges();const t=setInterval(refBadges,5000);return()=>clearInterval(t);},[refBadges]);
  const[callAlert,setCallAlert]=useState(null);
  useEffect(()=>{if(call||callAlert)return;const c=async()=>{try{const r=await API.get("/doctor/consultations");if(r.data.success){const inc=(r.data.consultations||[]).find(c=>c.type==="video"&&c.status==="scheduled"&&!c.doctorAlerted);if(inc){inc.patientName=inc.patientId?.name||"Patient";setCallAlert(inc);}}}catch{}};c();const t=setInterval(c,3000);return()=>clearInterval(t);},[did,call,callAlert]);
  const doc={name:dn,specialty:ds,avatar:da,...(ov?.doctor?.userId||{})};const sp={doctorId:did,doctor:doc,toast,refreshBadges:refBadges,sessionUser:su};
  if(call)return<JitsiVideoCall roomName={`Stech-Consultation-${call.id||call._id}`} displayName={dn||"Doctor"} onEndCall={()=>{API.patch("/doctor/consultations/"+(call.id||call._id),{status:"completed"}).catch(()=>{});toast("Session ended.");setCall(null);refBadges();}}/>;
  if(load)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0f4f9",fontFamily:"'DM Sans',sans-serif"}}><div style={{fontSize:18,fontWeight:700,color:"#64748b"}}>Loading Doctor Portal...</div></div>;
  if(err&&!ov)return<div style={{maxWidth:520,margin:"5rem auto",padding:"2rem",textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}><h1 style={{marginBottom:12}}>Doctor portal unavailable</h1><p style={{color:"#64748b",lineHeight:1.6}}>{err||"No data returned."}</p><button onClick={handleLogout} style={{marginTop:20,background:"#1e88e5",color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontWeight:700}}>Log out</button></div>;
  return(<div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f0f4f9",fontFamily:"'DM Sans',sans-serif",color:"#0f172a"}}>
    {callAlert&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:"#fff",borderRadius:24,padding:"36px 32px",maxWidth:420,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,.3)",border:"2px solid rgba(0,191,165,.3)"}}><div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#00bfa5,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 16px",color:"#fff",fontWeight:800}}>VC</div><h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,marginBottom:6}}>Incoming Video Call</h2><p style={{color:"#64748b",fontSize:14,marginBottom:4}}><strong>{callAlert.patientName}</strong> is waiting</p><p style={{color:"#94a3b8",fontSize:12,marginBottom:24}}>{callAlert.date} at {callAlert.time}</p><div style={{display:"flex",gap:12}}><button onClick={()=>{setCallAlert(null);API.patch("/doctor/consultations/"+(callAlert.id||callAlert._id),{status:"cancelled"}).catch(()=>{});toast("Declined.","warn");}} style={{flex:1,padding:"13px",borderRadius:14,border:"2px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Decline</button><button onClick={()=>{setCallAlert(null);setCall(callAlert);}} style={{flex:2,padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#00bfa5,#0891b2)",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Join Now</button></div></div></div>}
    <aside className={`dp-sidebar${side?" open":""}`}><div className="dp-brand"><div className="dp-brand-orb">+</div><div><div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:15,color:"#fff"}}>STECH</div><div style={{fontSize:10,color:"#94a3b8",letterSpacing:1.5,textTransform:"uppercase"}}>Doctor Portal</div></div></div>
    <div style={{margin:"0 12px 8px",padding:12,background:"rgba(255,255,255,.06)",borderRadius:12,display:"flex",gap:10,alignItems:"center"}}><Avatar name={dn} size={40} src={da}/><div style={{overflow:"hidden"}}><div style={{color:"#fff",fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dn}</div><div style={{color:"#00bfa5",fontSize:11,fontWeight:600}}>{ds}</div></div></div>
    <nav className="dp-nav">{NAV.map((n,i)=>{if(n.section)return<div key={i} className="dp-nav-section">{n.section}</div>;const badge=n.key==="notifications"?un:n.key==="appointments"?pa:0;return<button key={n.key} className={`dp-nav-item${tab===n.key?" active":""}`} onClick={()=>{setTab(n.key);setSide(false);}}><span className="dp-nav-icon">{n.icon}</span><span>{n.label}</span>{badge>0&&<span className="dp-nav-badge">{badge}</span>}</button>;})}</nav>
    <button className="dp-logout" onClick={handleLogout}>Logout</button></aside>
    <div className="dp-main"><header className="dp-topbar"><button className="dp-hamburger" onClick={()=>setSide(s=>!s)}>Menu</button><div style={{flex:1}}/><button className="dp-topbar-icon" onClick={()=>setTab("consultations")} style={{color:"#00bfa5"}}>Video</button><button className="dp-topbar-icon" onClick={()=>setTab("messages")}>Msg</button><button className="dp-topbar-icon" onClick={()=>setTab("notifications")}>Bell{un>0&&<sup className="dp-top-badge">{un}</sup>}</button><div onClick={()=>setTab("profile")} style={{cursor:"pointer"}}><Avatar name={dn} size={32} src={da}/></div></header>
    <main className="dp-content">{tab==="overview"&&<DocOverview {...sp} setTab={setTab} overviewData={ov}/>}{tab==="sos"&&<DoctorSOSAlerts onStartCall={c => { setCall(c); }}/>}{tab==="appointments"&&<DocAppointments {...sp} onStartCall={setCall}/>}{tab==="consultations"&&<DocConsultations {...sp} onStartCall={setCall}/>}{tab==="home_visits"&&<DocHomeVisits {...sp}/>}{tab==="patients"&&<DocPatients {...sp}/>}{tab==="prescriptions"&&<DocPrescriptions {...sp}/>}{tab==="records"&&<DocRecords {...sp}/>}{tab==="payments"&&<DocPayments {...sp}/>}{tab==="messages"&&<DocMessages {...sp}/>}{tab==="notifications"&&<DocNotifications {...sp}/>}{tab==="profile"&&<DocProfile {...sp}/>}</main></div>
    {side&&<div className="dp-overlay" onClick={()=>setSide(false)}/>}<Toaster toasts={toasts}/></div>);
}
function DocOverview({doctorId,doctor,setTab,overviewData}){const s=overviewData?.stats||{};const r=overviewData?.recentAppointments||[];const dp=overviewData?.doctor||{};const nm=dp?.userId?.name||doctor.name||"Doctor";const sp=dp?.specialty||doctor.specialty||"Specialist";const hr=new Date().getHours();const gr=hr<12?"Good Morning":hr<18?"Good Afternoon":"Good Evening";const fn=nm.split(" ").slice(-1)[0]||"Doctor";const today=todayStr();const ta=r.filter(a=>a.date===today||(typeof a.date==="string"&&a.date.startsWith(today)));return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">{gr}, Dr. {fn}</h1><p className="dp-sub">{sp} - {new Date().toDateString()}</p></div></div><div className="dp-stats">{[{l:"Appts Today",v:s.today||0,c:"#1e88e5"},{l:"Pending",v:s.pending||0,c:"#fbbf24"},{l:"Revenue",v:`${((s.revenue||0)/1000).toFixed(1)}K XAF`,c:"#16a34a"}].map(x=><div key={x.l} className="dp-stat-card" style={{"--acc":x.c}}><div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.6}}>{x.l}</div><div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:24}}>{x.v}</div></div>)}</div><div className="dp-two-col"><div className="dp-card"><div className="dp-card-head"><div className="dp-card-title">Today's Schedule</div></div>{ta.length===0?<div className="dp-empty"><p>No appointments today.</p></div>:ta.map(a=><div key={a.id||a._id} className="dp-row"><span style={{fontWeight:700,fontSize:13,minWidth:50}}>{a.time}</span><Avatar name={a.patientName||a.patientId?.name} size={36}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{a.patientName||a.patientId?.name}</div><div style={{fontSize:12,color:"#64748b"}}>{a.healthType}</div></div><Badge label={a.status}/></div>)}</div><div className="dp-card"><div className="dp-card-head"><div className="dp-card-title">Pending Requests</div></div>{r.filter(a=>a.status?.toUpperCase()==="PENDING").length===0?<div className="dp-empty"><p>All clear.</p></div>:r.filter(a=>a.status?.toUpperCase()==="PENDING").slice(0,5).map(a=><div key={a.id||a._id} className="dp-row"><Avatar name={a.patientName||a.patientId?.name} size={36}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{a.patientName||a.patientId?.name}</div><div style={{fontSize:12,color:"#64748b"}}>{a.healthType} - {a.date} {a.time}</div></div><Badge label="pending"/></div>)}</div></div></div>;}
function DocAppointments({toast,onStartCall}){const[i,setI]=useState([]);const[l,setL]=useState(true);const[f,setF]=useState("all");const[a,setA]=useState(false);const[pts,setPts]=useState([]);const T=["Consultation","Root Canal","Scaling","Whitening","Wisdom Teeth","Braces Check","Implant","X-Ray","Check-up","Emergency"];const fetchA=async(s)=>{setL(true);try{const r=await API.get("/doctor/appointments"+(s&&s!=="all"?`?status=${s}`:""));if(r.data.success)setI(r.data.appointments);}catch{}finally{setL(false);}};useEffect(()=>{fetchA(f);API.get("/doctor/patients").then(r=>{if(r.data.success)setPts(r.data.patients);}).catch(()=>{});},[f]);const up=async(id,s)=>{try{await API.patch(`/doctor/appointments/${id}/status`,{status:s.toUpperCase()});toast(`Status -> ${s}`);fetchA(f);}catch{toast("Update failed","error");}};const b={patientId:"",healthType:"",date:"",time:"09:00",notes:""};const[fm,setFm]=useState(b);const cr=async()=>{if(!fm.patientId||!fm.healthType||!fm.date){toast("Fill required fields","error");return;}try{await API.post("/doctor/appointments",{...fm,status:"PENDING"});toast("Created Request!");setFm(b);setA(false);fetchA(f);}catch{toast("Failed","error");}};return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">Appointments</h1><p className="dp-sub">{i.length} total</p></div><button className="dp-btn-primary" onClick={()=>setA(true)}>+ Schedule</button></div><div className="dp-card"><div className="dp-filter-tabs">{["all","pending","confirmed","cancelled","completed"].map(x=><button key={x} className={`dp-filter-tab${f===x?" active":""}`} onClick={()=>setF(x)}>{x.charAt(0).toUpperCase()+x.slice(1)}</button>)}</div>{l?<div className="dp-empty"><p>Loading...</p></div>:<div className="dp-tbl-wrap"><table className="dp-table"><thead><tr><th>Patient</th><th>Type</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>{i.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>None.</td></tr>}{i.map(a=><tr key={a.id||a._id}><td><Avatar name={a.patientName||a.patientId?.name} size={26}/>{a.patientName||a.patientId?.name}</td><td>{a.healthType}</td><td>{a.date}</td><td>{a.time}</td><td><Badge label={a.status}/></td><td>{a.status?.toUpperCase()==="PENDING"&&<><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>{up(a.id||a._id,"CONFIRMED");if(a.healthType==="Video Consultation"||a.isVideoConsultation)onStartCall(a);}}>Confirm</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(a.id||a._id,"CANCELLED")}>Cancel</button></>}{a.status?.toUpperCase()==="CONFIRMED"&&<>{(a.healthType==="Video Consultation"||a.isVideoConsultation)&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12,marginRight:6}} onClick={()=>onStartCall(a)}>Join</button>}<button className="dp-ghost" style={{color:"#1e88e5"}} onClick={()=>up(a.id||a._id,"COMPLETED")}>Done</button></>}</td></tr>)}</tbody></table></div>}</div>{a&&<Modal title="Schedule Appointment" onClose={()=>setA(false)}><FRow label="Patient"><select style={inp} value={fm.patientId} onChange={e=>setFm({...fm,patientId:e.target.value})}><option value="">Select...</option>{pts.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}</select></FRow><FRow label="Treatment"><select style={inp} value={fm.healthType} onChange={e=>setFm({...fm,healthType:e.target.value})}><option value="">Select...</option>{T.map(t=><option key={t}>{t}</option>)}</select></FRow><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><FRow label="Date"><input style={inp} type="date" value={fm.date} onChange={e=>setFm({...fm,date:e.target.value})}/></FRow><FRow label="Time"><select style={inp} value={fm.time} onChange={e=>setFm({...fm,time:e.target.value})}>{["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}</select></FRow></div><FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={fm.notes} onChange={e=>setFm({...fm,notes:e.target.value})}/></FRow><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="dp-ghost" onClick={()=>setA(false)}>Cancel</button><button className="dp-btn-primary" onClick={cr}>Create</button></div></Modal>}</div>;}
function DocConsultations({toast,onStartCall}){const[i,setI]=useState([]);const up=async(id,s)=>{try{await API.patch(`/doctor/consultations/${id}`,{status:s});toast(s==="accepted"?"Accepted":`${s}`);ref();}catch{toast("Failed","error");}};const[a,setA]=useState(false);const[l,setL]=useState(true);const[pts,setPts]=useState([]);const ref=async()=>{try{const r=await API.get("/doctor/consultations");if(r.data.success)setI(r.data.consultations);}catch{}finally{setL(false);}};useEffect(()=>{ref();API.get("/doctor/patients").then(r=>{if(r.data.success)setPts(r.data.patients);}).catch(()=>{});},[]);const b={patientId:"",type:"video",date:"",time:"10:00",notes:""};const[fm,setFm]=useState(b);const cr=async()=>{if(!fm.patientId||!fm.date){toast("Fill required fields","error");return;}try{await API.post("/doctor/consultations",{...fm,doctorInitiated:true,status:"pending"});toast("Created Request!");setFm(b);setA(false);ref();}catch{toast("Failed","error");}};return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">Video Calls</h1></div><button className="dp-btn-primary" onClick={()=>setA(true)}>+ Schedule</button></div><div className="dp-card">{l?<div className="dp-empty"><p>Loading...</p></div>:<div className="dp-tbl-wrap"><table className="dp-table"><thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>{i.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>None.</td></tr>}{i.map(c=><tr key={c.id||c._id}><td><Avatar name={c.patientName||c.patientId?.name} size={26}/>{c.patientName||c.patientId?.name}</td><td>{c.date}</td><td>{c.time}</td><td><Badge label={c.status}/></td><td>{c.status==="pending"&&<div style={{display:"flex",gap:6}}><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>up(c.id||c._id,"accepted")}>Accept</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(c.id||c._id,"declined")}>Reject</button></div>}{(c.status==="scheduled"||c.status==="accepted")&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>onStartCall(c)}>Join</button>}{c.status==="completed"&&<Badge label="Done" color="#22c55e"/>}</td></tr>)}</tbody></table></div>}</div>{a&&<Modal title="Schedule Video" onClose={()=>setA(false)}><FRow label="Patient"><select style={inp} value={fm.patientId} onChange={e=>setFm({...fm,patientId:e.target.value})}><option value="">Select...</option>{pts.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}</select></FRow><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><FRow label="Date"><input style={inp} type="date" value={fm.date} onChange={e=>setFm({...fm,date:e.target.value})}/></FRow><FRow label="Time"><select style={inp} value={fm.time} onChange={e=>setFm({...fm,time:e.target.value})}>{["09:00","10:00","11:00","13:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}</select></FRow></div><FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={fm.notes} onChange={e=>setFm({...fm,notes:e.target.value})}/></FRow><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="dp-ghost" onClick={()=>setA(false)}>Cancel</button><button className="dp-btn-primary" onClick={cr}>Schedule</button></div></Modal>}</div>;}
function DocHomeVisits({toast}){const[i,setI]=useState([]);const[l,setL]=useState(true);const[a,setA]=useState(false);const[pts,setPts]=useState([]);const ref=async()=>{try{const r=await API.get("/doctor/home-visits");if(r.data.success)setI(r.data.homeVisits);}catch{}finally{setL(false);}};useEffect(()=>{ref();API.get("/doctor/patients").then(r=>{if(r.data.success)setPts(r.data.patients);}).catch(()=>{});},[]);const b={patientId:"",address:"",date:"",time:"09:00",service:"",notes:""};const[fm,setFm]=useState(b);const cr=async()=>{if(!fm.patientId||!fm.date||!fm.address){toast("Fill required fields","error");return;}try{await API.post("/doctor/home-visits",fm);toast("Sent!");setFm(b);setA(false);ref();}catch{toast("Failed","error");}};const up=async(id,s)=>{try{await API.patch(`/doctor/home-visits/${id}`,{status:s});toast(s==="accepted"?"Accepted":`${s}`);ref();}catch{toast("Failed","error");}};return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">Home Visits</h1></div><button className="dp-btn-primary" onClick={()=>setA(true)}>+ Schedule</button></div>{l?<div className="dp-card"><div className="dp-empty"><p>Loading...</p></div></div>:<div style={{display:"flex",flexDirection:"column",gap:14}}>{i.length===0&&<div className="dp-card"><div className="dp-empty"><p>None.</p></div></div>}{i.map(r=><div key={r.id||r._id} className="dp-card"><div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}><div style={{flex:1}}><Avatar name={r.patientName||r.patientId?.name} size={44}/><div><div style={{fontWeight:700,fontSize:16}}>{r.patientName||r.patientId?.name}</div><div style={{fontSize:13,color:"#64748b"}}>{r.service||"Home Visit"}</div></div><div style={{fontSize:13,color:"#64748b"}}>{r.address} - {r.date}{r.time&&` at ${r.time}`}</div>{r.createdByDoctor&&(r.status==="scheduled"||r.status==="pending")&&<div style={{fontSize:12,color:"#7c3aed",fontStyle:"italic"}}>Awaiting patient</div>}</div><div><Badge label={r.status}/>{r.status==="pending"&&!r.createdByDoctor&&<div style={{display:"flex",gap:6,marginTop:8}}><button className="dp-ghost" style={{color:"#22c55e"}} onClick={()=>up(r.id||r._id,"accepted")}>Accept</button><button className="dp-ghost" style={{color:"#ef4444"}} onClick={()=>up(r.id||r._id,"declined")}>Decline</button></div>}{r.status==="accepted"&&<button className="dp-btn-primary" style={{padding:"6px 14px",fontSize:12,marginTop:8}} onClick={()=>up(r.id||r._id,"completed")}>Mark Completed</button>}</div></div></div>)}</div>}{a&&<Modal title="Schedule Home Visit" onClose={()=>setA(false)}><FRow label="Patient"><select style={inp} value={fm.patientId} onChange={e=>setFm({...fm,patientId:e.target.value})}><option value="">Select...</option>{pts.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}</select></FRow><FRow label="Address"><input style={inp} value={fm.address} onChange={e=>setFm({...fm,address:e.target.value})}/></FRow><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><FRow label="Date"><input style={inp} type="date" value={fm.date} onChange={e=>setFm({...fm,date:e.target.value})}/></FRow><FRow label="Time"><select style={inp} value={fm.time} onChange={e=>setFm({...fm,time:e.target.value})}>{["08:00","09:00","10:00","11:00","14:00","15:00","16:00"].map(t=><option key={t}>{t}</option>)}</select></FRow></div><FRow label="Notes"><textarea style={{...inp,height:72,resize:"vertical"}} value={fm.notes} onChange={e=>setFm({...fm,notes:e.target.value})}/></FRow><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="dp-ghost" onClick={()=>setA(false)}>Cancel</button><button className="dp-btn-primary" onClick={cr}>Send</button></div></Modal>}</div>;}

function DocPatients({ toast }) {
  const [pts, setPts] = useState([]);
  const [l, setL] = useState(true);
  const [chartPatient, setChartPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [toothModal, setToothModal] = useState(null); // { toothId, status }
  const [fm, setFm] = useState({ condition: 'Healthy', notes: '' });

  useEffect(() => {
    API.get("/doctor/patients").then(r => {
      if (r.data.success) setPts(r.data.patients);
      setL(false);
    }).catch(() => setL(false));
  }, []);

  const loadRecords = async (pId) => {
    try {
      const r = await API.get(`/doctor/patients/${pId}/dental-records`);
      if (r.data.success) setRecords(r.data.dentalRecords);
    } catch(e) {}
  };

  const handleOpenChart = (p) => {
    setChartPatient(p);
    loadRecords(p.id || p._id);
  };

  const handleToothClick = (toothId, status) => {
    setFm({ condition: status?.condition || 'Healthy', notes: status?.notes || '' });
    setToothModal({ toothId });
  };

  const handleSaveTooth = async () => {
    try {
      await API.post('/doctor/dental-records', {
        patientId: chartPatient.id || chartPatient._id,
        toothId: toothModal.toothId,
        condition: fm.condition,
        notes: fm.notes
      });
      toast("Record saved successfully!");
      setToothModal(null);
      loadRecords(chartPatient.id || chartPatient._id);
    } catch(e) {
      toast("Failed to save record", "error");
    }
  };

  if (l) return <div className="dp-anim"><div className="dp-empty"><p>Loading...</p></div></div>;

  if (chartPatient) {
    return (
      <div className="dp-anim" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="dp-page-head">
          <div>
            <h1 className="dp-title">{chartPatient.name}'s 3D Chart</h1>
            <p className="dp-sub">Click any tooth to update status</p>
          </div>
          <button className="dp-ghost" onClick={() => setChartPatient(null)}>? Back</button>
        </div>
        <DentalChart records={records} readOnly={false} onToothClick={handleToothClick} />

        {toothModal && (
          <Modal title={`Update Tooth ${toothModal.toothId}`} onClose={() => setToothModal(null)}>
            <FRow label="Condition">
              <select style={inp} value={fm.condition} onChange={e => setFm({...fm, condition: e.target.value})}>
                {["Healthy", "Cavity", "Crown", "Extracted", "Implant", "Filling", "Root Canal", "Veneer", "Bridge", "Watch"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FRow>
            <FRow label="Notes">
              <textarea style={{...inp, height: 80, resize: "vertical"}} value={fm.notes} onChange={e => setFm({...fm, notes: e.target.value})} placeholder="Optional notes about this tooth" />
            </FRow>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button className="dp-ghost" onClick={() => setToothModal(null)}>Cancel</button>
              <button className="dp-btn-primary" onClick={handleSaveTooth}>Save</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div>
          <h1 className="dp-title">My Patients</h1>
          <p className="dp-sub">{pts.length} patients</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
        {pts.length===0 && <div className="dp-card"><div className="dp-empty"><p>None.</p></div></div>}
        {pts.map(p => (
          <div key={p.id||p._id} className="dp-card">
            <Avatar name={p.name} size={44} src={p.avatar}/>
            <div style={{fontWeight:700,fontSize:15}}>{p.name}</div>
            <div style={{fontSize:12,color:"#64748b"}}>{p.email}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Blood: {p.bloodType||"\u2014"}</div>
            <div style={{fontSize:13,color:"#64748b"}}>Allergies: {p.allergies||"None"}</div>
            <button className="dp-btn-primary" style={{width: '100%', marginTop: 12}} onClick={() => handleOpenChart(p)}>View 3D Chart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocPrescriptions({toast}) {
  const [i, setI] = useState([]);
  const [l, setL] = useState(true);
  const [m, setM] = useState(false);
  const [pts, setPts] = useState([]);
  const [editId, setEditId] = useState(null);
  
  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", frequency: "", duration: "" }]);

  const ref = async () => {
    try {
      const r = await API.get("/doctor/prescriptions");
      if (r.data.success) setI(r.data.prescriptions);
    } catch { } finally { setL(false); }
  };

  useEffect(() => {
    ref();
    API.get("/doctor/patients").then(r => {
      if (r.data.success) setPts(r.data.patients);
    }).catch(() => {});
  }, []);

  const handleMedChange = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const addMed = () => setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }]);
  const removeMed = (index) => setMedicines(medicines.filter((_, idx) => idx !== index));

  const openAdd = () => {
    setEditId(null); setPatientId(""); setDiagnosis(""); setNotes("");
    setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }]);
    setM(true);
  };

  const openEdit = (p) => {
    setEditId(p.id || p._id);
    setPatientId(p.patientId);
    setDiagnosis(p.diagnosis || "");
    setNotes(p.notes || "");
    setMedicines(p.medicines && p.medicines.length > 0 ? p.medicines : [{ name: p.medication || "", dosage: p.dosage || "", frequency: "", duration: p.duration || "" }]);
    setM(true);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    try {
      await API.delete(`/doctor/prescriptions/${id}`);
      toast("Deleted"); ref();
    } catch { toast("Failed", "error"); }
  };

  const printPresc = (presc) => {
    const html = `
      <html><head><title>Print Prescription</title><style>
        body { font-family: sans-serif; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 4px 0 0; color: #64748b; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f8fafc; }
      </style></head><body>
        <div class="header"><h1>🩺 TOOTHEASE</h1><p>Official Prescription</p></div>
        <div class="info"><div>Patient: ${presc.patientName}</div><div>Date: ${presc.createdAt ? new Date(presc.createdAt).toISOString().split('T')[0] : presc.date}</div></div>
        ${presc.diagnosis ? `<p><strong>Diagnosis:</strong> ${presc.diagnosis}</p>` : ''}
        <table><thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>
          ${presc.medicines && presc.medicines.length > 0 
            ? presc.medicines.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage||'-'}</td><td>${m.frequency||'-'}</td><td>${m.duration||'-'}</td></tr>`).join('')
            : `<tr><td><strong>${presc.medication}</strong></td><td>${presc.dosage||'-'}</td><td>-</td><td>${presc.duration||'-'}</td></tr>`
          }
        </tbody></table>
        ${presc.notes ? `<div style="margin-top: 20px;"><h3>Clinical Notes</h3><p>${presc.notes}</p></div>` : ''}
        <div style="margin-top: 60px; text-align: right;"><div>___________________________</div><div style="margin-top: 8px;">Doctor's Signature</div></div>
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const sub = async () => {
    if (!patientId || !diagnosis || !medicines[0].name) {
      toast("Fill required fields", "error"); return;
    }
    try {
      const payload = {
        patientId, diagnosis, notes,
        medicines: medicines.filter(m => m.name.trim() !== "")
      };
      if (editId) {
        await API.put(`/doctor/prescriptions/${editId}`, payload);
        toast("Updated!");
      } else {
        await API.post("/doctor/prescriptions", payload);
        toast("Issued!");
      }
      setM(false); ref();
    } catch { toast("Failed", "error"); }
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Prescriptions</h1><p className="dp-sub">{i.length} issued</p></div>
        <button className="dp-btn-primary" onClick={openAdd}>+ New Prescription</button>
      </div>
      <div className="dp-card">
        {l ? <div className="dp-empty"><p>Loading...</p></div> : 
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead>
              <tr><th>Patient</th><th>Diagnosis</th><th>Medications</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {i.length === 0 && <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>None.</td></tr>}
              {i.map(p => (
                <tr key={p.id||p._id}>
                  <td><div style={{display:"flex", alignItems:"center", gap: 8}}><Avatar name={p.patientName} size={26}/>{p.patientName}</div></td>
                  <td style={{fontWeight:700}}>{p.diagnosis || "-"}</td>
                  <td>{p.medicines && p.medicines.length > 0 ? p.medicines.map(m=>m.name).join(", ") : (p.medication || "-")}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : p.date}</td>
                  <td>
                    <div style={{display: "flex", gap: 6}}>
                      <button className="dp-ghost" style={{padding: "4px 8px"}} onClick={() => printPresc(p)}><i className="ti ti-printer"/></button>
                      <button className="dp-ghost" style={{padding: "4px 8px", color: "#3b82f6"}} onClick={() => openEdit(p)}><i className="ti ti-pencil"/></button>
                      <button className="dp-ghost" style={{padding: "4px 8px", color: "#ef4444"}} onClick={() => del(p.id||p._id)}><i className="ti ti-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
      {m && <Modal title={editId ? "Edit Prescription" : "New Prescription"} onClose={() => setM(false)}>
        <FRow label="Patient">
          <select style={inp} value={patientId} onChange={e=>setPatientId(e.target.value)}>
            <option value="">Select Patient...</option>
            {pts.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
          </select>
        </FRow>
        <FRow label="Diagnosis / Condition">
          <input style={inp} value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="e.g. Acute Bronchitis" />
        </FRow>
        
        <div style={{fontWeight: 600, marginTop: 16, marginBottom: 8, fontSize: 14}}>Medications</div>
        <div style={{background: "#f8fafc", padding: 12, borderRadius: 8, display: "flex", flexDirection: "column", gap: 12}}>
          {medicines.map((med, index) => (
            <div key={index} style={{display: "flex", flexDirection: "column", gap: 8, background: "#fff", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0"}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <strong style={{fontSize: 13, color: "#64748b"}}>Medication #{index + 1}</strong>
                {index > 0 && <button className="dp-ghost" style={{color: "#ef4444", padding: "2px 6px", fontSize: 12}} onClick={() => removeMed(index)}>Remove</button>}
              </div>
              <input style={inp} value={med.name} onChange={e=>handleMedChange(index, 'name', e.target.value)} placeholder="Drug Name (e.g. Amoxicillin)" />
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8}}>
                <input style={inp} value={med.dosage} onChange={e=>handleMedChange(index, 'dosage', e.target.value)} placeholder="Dosage (500mg)" />
                <input style={inp} value={med.frequency} onChange={e=>handleMedChange(index, 'frequency', e.target.value)} placeholder="Freq (2x/day)" />
                <input style={inp} value={med.duration} onChange={e=>handleMedChange(index, 'duration', e.target.value)} placeholder="Duration (7 days)" />
              </div>
            </div>
          ))}
          <button className="dp-ghost" style={{alignSelf: "flex-start", fontSize: 13}} onClick={addMed}>+ Add Another Medication</button>
        </div>

        <FRow label="Clinical Notes / Advice">
          <textarea style={{...inp,height:72,resize:"vertical", marginTop: 12}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Additional instructions for the patient..."/>
        </FRow>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end", marginTop: 24}}>
          <button className="dp-ghost" onClick={() => setM(false)}>Cancel</button>
          <button className="dp-btn-primary" onClick={sub}>{editId ? "Update" : "Issue Prescription"}</button>
        </div>
      </Modal>}
    </div>
  );
}
function DocRecords({toast}) {
  const [pts, setPts] = useState([]);
  const [sel, setSel] = useState("");
  const [recs, setRecs] = useState([]);
  const [l, setL] = useState(false);
  const [m, setM] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const b = { title: "", type: "note", description: "", bp: "", hr: "", temp: "", weight: "", symptoms: "", treatmentPlan: "", attachment: "" };
  const [fm, setFm] = useState(b);
  const T = ["procedure", "imaging", "lab", "prescription", "note", "diagnosis"];

  useEffect(() => {
    API.get("/doctor/patients").then(r => {
      if (r.data.success) setPts(r.data.patients);
    }).catch(() => {});
  }, []);

  const ref = async () => {
    if (!sel) return;
    setL(true);
    try {
      const r = await API.get(`/doctor/records/${sel}`);
      if (r.data.success) setRecs(r.data.records);
    } catch { setRecs([]); } finally { setL(false); }
  };
  useEffect(() => { ref(); }, [sel]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFm({ ...fm, attachment: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => { setEditId(null); setFm(b); setM(true); };
  
  const openEdit = (r) => {
    setEditId(r.id || r._id);
    setFm({
      title: r.title, type: r.type, description: r.description,
      bp: r.vitals?.bp || "", hr: r.vitals?.hr || "", temp: r.vitals?.temp || "", weight: r.vitals?.weight || "",
      symptoms: r.symptoms || "", treatmentPlan: r.treatmentPlan || "", attachment: r.attachment || ""
    });
    setM(true);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await API.delete(`/doctor/records/${id}`);
      toast("Deleted"); ref();
    } catch { toast("Failed", "error"); }
  };

  const sub = async () => {
    if (!sel || !fm.title) { toast("Title is required", "error"); return; }
    try {
      const payload = {
        patientId: sel, title: fm.title, type: fm.type, description: fm.description,
        vitals: { bp: fm.bp, hr: fm.hr, temp: fm.temp, weight: fm.weight },
        symptoms: fm.symptoms, treatmentPlan: fm.treatmentPlan, attachment: fm.attachment
      };
      if (editId) {
        await API.put(`/doctor/records/${editId}`, payload);
        toast("Updated!");
      } else {
        await API.post("/doctor/records", payload);
        toast("Saved!");
      }
      setFm(b); setM(false); setEditId(null); ref();
    } catch { toast("Failed", "error"); }
  };

  const printRecord = (r) => {
    const p = pts.find(x => (x.id || x._id) === sel);
    const pName = p ? p.name : "Unknown Patient";
    const html = `
      <html><head><title>Print Medical Record</title><style>
        body { font-family: sans-serif; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .header p { margin: 4px 0 0; color: #64748b; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
        .section { margin-top: 20px; }
        .section h3 { margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; }
      </style></head><body>
        <div class="header"><h1>🩺 TOOTHEASE</h1><p>Official Medical Record</p></div>
        <div class="info"><div>Patient: ${pName}</div><div>Date: ${r.date}</div></div>
        <h2>${r.title} <span style="font-size:14px;font-weight:normal;color:#64748b;text-transform:capitalize;">(${r.type})</span></h2>
        <div class="section"><h3>Clinical Notes</h3><p>${r.description}</p></div>
        ${r.vitals && (r.vitals.bp || r.vitals.hr || r.vitals.temp || r.vitals.weight) ? `
          <div class="section"><h3>Vitals</h3><div class="vitals-grid">
            ${r.vitals.bp ? `<div><small>Blood Pressure</small><br/><strong>${r.vitals.bp}</strong></div>` : ''}
            ${r.vitals.hr ? `<div><small>Heart Rate</small><br/><strong>${r.vitals.hr}</strong></div>` : ''}
            ${r.vitals.temp ? `<div><small>Temperature</small><br/><strong>${r.vitals.temp}</strong></div>` : ''}
            ${r.vitals.weight ? `<div><small>Weight</small><br/><strong>${r.vitals.weight}</strong></div>` : ''}
          </div></div>` : ''}
        ${r.symptoms ? `<div class="section"><h3>Symptoms</h3><p>${r.symptoms}</p></div>` : ''}
        ${r.treatmentPlan ? `<div class="section"><h3>Treatment Plan</h3><p>${r.treatmentPlan}</p></div>` : ''}
        ${r.attachment ? `<div class="section"><h3>Attachment</h3><br/><img src="${r.attachment}" style="max-width: 100%; max-height: 400px; border-radius: 8px;"/></div>` : ''}
      </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Clinical Records</h1></div>
        <button className="dp-btn-primary" onClick={openAdd} disabled={!sel}>+ Add Record</button>
      </div>
      <div className="dp-card" style={{ marginBottom: 16 }}>
        <FRow label="Select Patient">
          <select style={{...inp,maxWidth:320}} value={sel} onChange={e=>setSel(e.target.value)}>
            <option value="">Choose...</option>
            {pts.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
          </select>
        </FRow>
      </div>
      {sel && <div className="dp-card">
        {l ? <div className="dp-empty"><p>Loading...</p></div> : recs.length===0 ? <div className="dp-empty"><p>No records found.</p></div> : recs.map(r => (
          <div key={r.id||r._id} style={{padding:"16px",borderBottom:"1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12}}>
            <div style={{display:"flex",justifyContent:"space-between", alignItems: "flex-start"}}>
              <div>
                <div style={{fontWeight:700, fontSize: 16}}>{r.title}</div>
                <div style={{fontSize:13,color:"#64748b", marginTop: 4}}>{r.description}</div>
              </div>
              <div style={{display:"flex", gap: 8, alignItems: "center"}}>
                <Badge label={r.type} color="#1e88e5"/>
                <span style={{fontSize:12,color:"#94a3b8"}}>{r.date}</span>
                <button className="dp-ghost" style={{padding: "4px 8px"}} onClick={() => printRecord(r)}><i className="ti ti-printer"/></button>
                <button className="dp-ghost" style={{padding: "4px 8px", color: "#3b82f6"}} onClick={() => openEdit(r)}><i className="ti ti-pencil"/></button>
                <button className="dp-ghost" style={{padding: "4px 8px", color: "#ef4444"}} onClick={() => del(r.id||r._id)}><i className="ti ti-trash"/></button>
              </div>
            </div>
            {r.vitals && (r.vitals.bp || r.vitals.hr || r.vitals.temp || r.vitals.weight) && (
              <div style={{background: "#f8fafc", padding: "12px", borderRadius: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12}}>
                {r.vitals.bp && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Blood Pressure</span><strong style={{fontSize: 13}}>{r.vitals.bp}</strong></div>}
                {r.vitals.hr && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Heart Rate</span><strong style={{fontSize: 13}}>{r.vitals.hr}</strong></div>}
                {r.vitals.temp && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Temperature</span><strong style={{fontSize: 13}}>{r.vitals.temp}</strong></div>}
                {r.vitals.weight && <div><span style={{color: "#64748b", fontSize: 11, display: "block"}}>Weight</span><strong style={{fontSize: 13}}>{r.vitals.weight}</strong></div>}
              </div>
            )}
            {r.symptoms && <div><strong style={{fontSize: 13}}>Symptoms:</strong> <span style={{fontSize: 13}}>{r.symptoms}</span></div>}
            {r.treatmentPlan && <div><strong style={{fontSize: 13}}>Treatment Plan:</strong> <span style={{fontSize: 13}}>{r.treatmentPlan}</span></div>}
            {r.attachment && <img src={r.attachment} alt="Attachment" style={{maxHeight: 150, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0"}} />}
          </div>
        ))}
      </div>}
      {m && <Modal title={editId ? "Edit Record" : "New Clinical Record"} onClose={() => setM(false)}>
        <FRow label="Record Title"><input style={inp} value={fm.title} onChange={e=>setFm({...fm,title:e.target.value})} placeholder="e.g. Initial Assessment" /></FRow>
        <FRow label="Category">
          <select style={inp} value={fm.type} onChange={e=>setFm({...fm,type:e.target.value})}>{T.map(t=><option key={t}>{t}</option>)}</select>
        </FRow>
        <div style={{fontWeight: 600, marginTop: 16, marginBottom: 8, fontSize: 14}}>Vitals (Optional)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FRow label="BP (mmHg)"><input style={inp} value={fm.bp} onChange={e=>setFm({...fm,bp:e.target.value})} placeholder="120/80"/></FRow>
          <FRow label="Heart Rate (bpm)"><input style={inp} value={fm.hr} onChange={e=>setFm({...fm,hr:e.target.value})} placeholder="72"/></FRow>
          <FRow label="Temp (°C/°F)"><input style={inp} value={fm.temp} onChange={e=>setFm({...fm,temp:e.target.value})} placeholder="36.5"/></FRow>
          <FRow label="Weight (kg/lb)"><input style={inp} value={fm.weight} onChange={e=>setFm({...fm,weight:e.target.value})} placeholder="70kg"/></FRow>
        </div>
        <FRow label="Chief Complaint / Symptoms"><textarea style={{...inp,height:60,resize:"vertical"}} value={fm.symptoms} onChange={e=>setFm({...fm,symptoms:e.target.value})}/></FRow>
        <FRow label="Clinical Notes / Description"><textarea style={{...inp,height:80,resize:"vertical"}} value={fm.description} onChange={e=>setFm({...fm,description:e.target.value})}/></FRow>
        <FRow label="Treatment Plan"><textarea style={{...inp,height:60,resize:"vertical"}} value={fm.treatmentPlan} onChange={e=>setFm({...fm,treatmentPlan:e.target.value})}/></FRow>
        <FRow label="Upload Image/Attachment">
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{...inp, padding: "6px"}} />
          {fm.attachment && <img src={fm.attachment} alt="Preview" style={{height: 60, marginTop: 8, borderRadius: 4}} />}
        </FRow>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end", marginTop: 24}}>
          <button className="dp-ghost" onClick={() => setM(false)}>Cancel</button>
          <button className="dp-btn-primary" onClick={sub}>{editId ? "Update" : "Save Record"}</button>
        </div>
      </Modal>}
    </div>
  );
}

function DocPayments({toast}) {
  const [i, setI] = useState([]);
  const [l, setL] = useState(true);
  const [m, setM] = useState(false); // Edit modal
  const [invModal, setInvModal] = useState(false); // Invoice A4 modal
  const [selInv, setSelInv] = useState(null);
  const [pts, setPts] = useState([]);
  const [editId, setEditId] = useState(null);

  const b = { patientId: "", service: "", amount: "", method: "Cash", status: "COMPLETED" };
  const [fm, setFm] = useState(b);

  const ref = async () => {
    try {
      const r = await API.get("/doctor/payments");
      if (r.data.success) setI(r.data.payments);
    } catch { } finally { setL(false); }
  };

  useEffect(() => {
    ref();
    API.get("/doctor/patients").then(r => {
      if (r.data.success) setPts(r.data.patients);
    }).catch(() => {});
  }, []);

  const tp = i.filter(p => p.status === "paid" || p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);

  const openAdd = () => { setEditId(null); setFm(b); setM(true); };
  
  const openEdit = (p) => {
    setEditId(p.id || p._id);
    setFm({ patientId: p.patientId?._id || p.patientId, service: p.service, amount: p.amount, method: p.method, status: p.status });
    setM(true);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await API.delete(`/doctor/payments/${id}`);
      toast("Deleted"); ref();
    } catch { toast("Failed", "error"); }
  };

  const sub = async () => {
    if (!fm.patientId || !fm.service || !fm.amount) { toast("Fill required fields", "error"); return; }
    try {
      if (editId) {
        await API.put(`/doctor/payments/${editId}`, fm);
        toast("Updated!");
      } else {
        await API.post("/doctor/payments", fm);
        toast("Saved!");
      }
      setM(false); ref();
    } catch { toast("Error saving", "error"); }
  };

  const openInvoice = (p) => {
    setSelInv(p);
    setInvModal(true);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head hide-print">
        <div><h1 className="dp-title">Payments & Invoices</h1><p className="dp-sub">Total earned: {tp.toLocaleString()} XAF</p></div>
        <button className="btn-primary" onClick={openAdd}>+ Record Payment</button>
      </div>
      <div className="dp-card hide-print">
        <div className="dp-tbl-wrap">
          <table className="dp-table">
            <thead><tr><th>Patient</th><th>Service</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {i.length===0 && <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No payments found.</td></tr>}
              {i.map(p => (
                <tr key={p._id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Avatar name={p.patientId?.name||"?"} size={28}/>
                      {p.patientId?.name}
                    </div>
                  </td>
                  <td>{p.service}</td>
                  <td style={{fontWeight:700}}>{p.amount}</td>
                  <td>{p.method}</td>
                  <td><Badge label={p.status}/></td>
                  <td>
                    <div style={{display:"flex",gap:8}}>
                      <button className="ghost-btn" style={{color:"#1e88e5"}} onClick={()=>openInvoice(p)}>📄 Invoice</button>
                      <button className="ghost-btn" onClick={()=>openEdit(p)}>✏️ Edit</button>
                      <button className="ghost-btn" style={{color:"#ef4444"}} onClick={()=>del(p._id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {m && (
        <Modal title={editId ? "Edit Payment" : "New Payment"} onClose={() => setM(false)} width={400}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{display:"block",marginBottom:6,fontSize:12,fontWeight:600,color:"var(--muted)"}}>Patient*</label>
              <select className="s-inp" value={fm.patientId} onChange={e=>setFm({...fm, patientId: e.target.value})}>
                <option value="">Select Patient...</option>
                {pts.map(pt => <option key={pt._id} value={pt._id}>{pt.name}</option>)}
              </select>
            </div>
            <FRow label="Service/Item*"><input className="s-inp" value={fm.service} onChange={e=>setFm({...fm, service: e.target.value})}/></FRow>
            <FRow label="Amount (XAF)*"><input className="s-inp" type="number" value={fm.amount} onChange={e=>setFm({...fm, amount: e.target.value})}/></FRow>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1}}>
                <label style={{display:"block",marginBottom:6,fontSize:12,fontWeight:600,color:"var(--muted)"}}>Method</label>
                <select className="s-inp" value={fm.method} onChange={e=>setFm({...fm, method: e.target.value})}>
                  <option>Cash</option><option>Card</option><option>Mobile Money</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",marginBottom:6,fontSize:12,fontWeight:600,color:"var(--muted)"}}>Status</label>
                <select className="s-inp" value={fm.status} onChange={e=>setFm({...fm, status: e.target.value})}>
                  <option>COMPLETED</option><option>PENDING</option><option>FAILED</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:10}}>
              <button className="ghost-btn" onClick={()=>setM(false)}>Cancel</button>
              <button className="btn-primary" onClick={sub}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      {invModal && selInv && (
        <div className="modal-backdrop print-fullscreen" style={{zIndex:9999, overflowY:"auto"}}>
          <div className="modal-content print-a4" style={{width: 800, maxWidth:"100%", margin:"40px auto", padding:40, background:"#fff"}}>
            {/* Header / Actions - Hidden on print */}
            <div className="hide-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0}}>Invoice View</h3>
              <div>
                <button className="btn-primary" onClick={printInvoice} style={{marginRight:10}}>🖨️ Print Invoice</button>
                <button className="ghost-btn" onClick={()=>setInvModal(false)}>Close</button>
              </div>
            </div>

            {/* A4 Document Area */}
            <div className="a4-document" style={{color:"#000", fontFamily:"'Sora', sans-serif"}}>
              {/* Brand Header */}
              <div style={{textAlign:"center", borderBottom:"3px solid #1e88e5", paddingBottom:20, marginBottom:30}}>
                <div style={{fontSize:36, fontWeight:800, color:"#1e88e5", letterSpacing:2}}>TOOTHEASE</div>
                <div style={{fontSize:14, color:"#475569", marginTop:4}}>Modern Dental Clinic</div>
                <div style={{fontSize:12, color:"#64748b", marginTop:4}}>Douala, Cameroon | +237 600 000 000 | contact@toothease.com</div>
              </div>

              {/* Invoice Title */}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:30}}>
                <div>
                  <h1 style={{fontSize:32, margin:0, color:"#0f172a", textTransform:"uppercase"}}>INVOICE</h1>
                  <div style={{fontSize:13, color:"#64748b", marginTop:4}}>INV-{selInv._id?.substring(0,8).toUpperCase()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14}}><strong>Date:</strong> {new Date(selInv.createdAt || new Date()).toLocaleDateString()}</div>
                  <div style={{fontSize:14, marginTop:4}}><strong>Status:</strong> <span style={{color:selInv.status==="COMPLETED"||selInv.status==="paid"?"#16a34a":"#ef4444"}}>{selInv.status}</span></div>
                </div>
              </div>

              {/* Parties */}
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:40, background:"#f8fafc", padding:20, borderRadius:8}}>
                <div>
                  <div style={{fontSize:12, fontWeight:700, color:"#64748b", marginBottom:8, textTransform:"uppercase"}}>Billed To:</div>
                  <div style={{fontSize:16, fontWeight:700, color:"#0f172a"}}>{selInv.patientId?.name || "Unknown Patient"}</div>
                  <div style={{fontSize:14, color:"#475569", marginTop:4}}>{selInv.patientId?.email}</div>
                  <div style={{fontSize:14, color:"#475569", marginTop:2}}>{selInv.patientId?.phone}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12, fontWeight:700, color:"#64748b", marginBottom:8, textTransform:"uppercase"}}>Provider:</div>
                  <div style={{fontSize:16, fontWeight:700, color:"#0f172a"}}>Dr. {selInv.doctorId?.userId?.name || "Doctor"}</div>
                  <div style={{fontSize:14, color:"#475569", marginTop:4}}>{selInv.doctorId?.specialty || "Dental Specialist"}</div>
                </div>
              </div>

              {/* Line Items */}
              <table style={{width:"100%", borderCollapse:"collapse", marginBottom:40}}>
                <thead>
                  <tr style={{background:"#1e88e5", color:"#fff"}}>
                    <th style={{padding:"12px 16px", textAlign:"left", borderTopLeftRadius:6}}>Description of Service</th>
                    <th style={{padding:"12px 16px", textAlign:"center"}}>Payment Method</th>
                    <th style={{padding:"12px 16px", textAlign:"right", borderTopRightRadius:6}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom:"1px solid #e2e8f0"}}>
                    <td style={{padding:"16px", fontSize:15, fontWeight:600}}>{selInv.service}</td>
                    <td style={{padding:"16px", fontSize:14, textAlign:"center"}}>{selInv.method || "Cash"}</td>
                    <td style={{padding:"16px", fontSize:15, fontWeight:700, textAlign:"right"}}>{selInv.amount?.toLocaleString()} XAF</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div style={{display:"flex", justifyContent:"flex-end", marginBottom:50}}>
                <div style={{width: 300}}>
                  <div style={{display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #e2e8f0"}}>
                    <span style={{color:"#64748b", fontWeight:600}}>Subtotal:</span>
                    <span style={{fontWeight:600}}>{selInv.amount?.toLocaleString()} XAF</span>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #e2e8f0"}}>
                    <span style={{color:"#64748b", fontWeight:600}}>Tax (0%):</span>
                    <span style={{fontWeight:600}}>0 XAF</span>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", padding:"16px", background:"#f8fafc", borderRadius:6, marginTop:8}}>
                    <span style={{color:"#0f172a", fontWeight:800, fontSize:18}}>Total Due:</span>
                    <span style={{color:"#1e88e5", fontWeight:800, fontSize:18}}>{selInv.amount?.toLocaleString()} XAF</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{textAlign:"center", color:"#64748b", fontSize:12, borderTop:"1px solid #e2e8f0", paddingTop:20, marginTop:"auto"}}>
                Thank you for trusting TOOTHEASE with your dental care.<br/>
                For billing inquiries, please contact our support team.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function DocMessages({toast}){const[pts,setPts]=useState([]);const[ct,setCt]=useState([]);const[sel,setSel]=useState("admin");const[ms,setMs]=useState([]);const[msgText,setMsgText]=useState("");const end=useRef(null);useEffect(()=>{API.get("/doctor/patients").then(r=>{if(r.data.success){setPts(r.data.patients);setCt([{id:"admin",name:"Administrator",role:"Admin"},...r.data.patients.map(p=>({id:p.id||p._id,name:p.name,role:"Patient"}))]);}}).catch(()=>{});},[]);const load=useCallback(async()=>{if(!sel)return;try{const r=await API.get(`/doctor/messages/${sel}`);if(r.data.success)setMs(r.data.messages);}catch{}},[sel]);useEffect(()=>{load();},[sel]);useEffect(()=>{const t=setInterval(load,2000);return()=>clearInterval(t);},[load]);useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"});},[ms]);const send=async()=>{if(!msgText.trim()||!sel)return;try{await API.post("/doctor/messages",{receiverId:sel,text:msgText.trim()});setMsgText("");load();}catch{toast("Failed","error");}};const sc=ct.find(c=>c.id===sel);return<div className="dp-anim"><div className="dp-page-head"><div><h1 className="dp-title">Messages</h1></div></div><div className="dp-msg-layout"><div className="dp-msg-contacts">{ct.map(c=><div key={c.id} className={`dp-msg-contact${sel===c.id?" active":""}`} onClick={()=>setSel(c.id)}><Avatar name={c.name} size={36}/><div style={{flex:1,overflow:"hidden"}}><div style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{c.role}</div></div></div>)}</div><div className="dp-msg-chat">{sc&&<><div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:10}}><Avatar name={sc.name} size={36}/><div style={{fontWeight:700,fontSize:14}}>{sc.name}</div></div><div className="dp-chat-msgs">{ms.length===0&&<div className="dp-empty"><p>No messages.</p></div>}{ms.map(m=><div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from==="doctor"?"flex-end":"flex-start",marginBottom:8}}><div style={{background:m.from==="doctor"?"#00bfa5":"#f1f5f9",color:m.from==="doctor"?"#fff":"#0f172a",borderRadius:14,padding:"9px 14px",maxWidth:"72%",fontSize:13}}>{m.text}</div></div>)}<div ref={end}/></div><div style={{padding:"10px 14px",borderTop:"1px solid #e2e8f0",display:"flex",gap:8}}><input style={{...inp,flex:1}} placeholder="Type..." value={msgText} onChange={e=>setMsgText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/><button className="dp-btn-primary" style={{padding:"9px 16px"}} onClick={send}>Send</button></div></>}</div></div></div>;}
function DocNotifications({toast}) {
  const [i, setI] = useState([]);
  const ref = async () => {
    try {
      const r = await API.get("/doctor/notifications");
      if (r.data.success) setI(r.data.notifications || []);
    } catch {}
  };
  useEffect(() => { ref(); const t = setInterval(ref, 5000); return () => clearInterval(t); }, []);

  const clearAll = async () => {
    if(!window.confirm("Clear all notifications?")) return;
    try { await API.delete("/doctor/notifications/clear"); toast("Cleared"); ref(); } catch {}
  };

  const del = async (id) => {
    try { await API.delete(`/doctor/notifications/${id}`); ref(); } catch {}
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">Notifications</h1></div>
        {i.length > 0 && <button className="dp-ghost" style={{color: "#ef4444"}} onClick={clearAll}><i className="ti ti-trash"/> Clear All</button>}
      </div>
      <div className="dp-card" style={{padding: 0}}>
        {i.length === 0 && <div className="dp-empty" style={{padding: 40}}><p>No new notifications.</p></div>}
        {i.map(n => (
          <div key={n.id||n._id} style={{display:"flex",gap:14,padding:"16px 20px",borderBottom:"1px solid #e2e8f0", alignItems: "center"}}>
            <div style={{width: 40, height: 40, borderRadius: "50%", background: "var(--dp-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dp-primary)"}}>
              <i className="ti ti-bell" style={{fontSize: 20}} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14, color: "#0f172a"}}>{n.title}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{n.body}</div>
            </div>
            <button className="dp-ghost" style={{padding: "4px 8px", color: "#ef4444"}} onClick={() => del(n.id||n._id)}><i className="ti ti-x"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
function DocProfile({toast, sessionUser, doctor}) {
  const [f, setF] = useState({
    name: sessionUser?.name || doctor.name || "",
    email: sessionUser?.email || doctor.email || "",
    phone: sessionUser?.phone || doctor.phone || "",
    specialty: sessionUser?.specialty || doctor.specialty || "",
    bio: doctor.bio || "",
    location: doctor.location || "",
    avatar: sessionUser?.avatar || doctor.avatar || ""
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setF({ ...f, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    try {
      // Assuming patch /api/users/me handles avatar update too, or doctor profile
      await API.patch("/doctor/profile", { name: f.name, phone: f.phone, specialty: f.specialty, location: f.location, bio: f.bio, avatar: f.avatar });
      toast("Saved!");
    } catch { toast("Failed", "error"); }
  };

  return (
    <div className="dp-anim">
      <div className="dp-page-head">
        <div><h1 className="dp-title">My Profile</h1></div>
      </div>
      <div className="dp-two-col">
        <div className="dp-card" style={{textAlign:"center", display: "flex", flexDirection: "column", alignItems: "center"}}>
          <div style={{position: "relative", marginBottom: 16}}>
            {f.avatar ? <img src={f.avatar} style={{width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0"}} /> : <Avatar name={f.name||"Dr"} size={100}/>}
            <label style={{position: "absolute", bottom: 0, right: 0, background: "var(--dp-primary)", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff"}}>
              <i className="ti ti-camera" />
              <input type="file" accept="image/*" style={{display: "none"}} onChange={handleImageUpload} />
            </label>
          </div>
          <div style={{fontWeight:700,fontSize:18}}>{f.name}</div>
          <div style={{fontSize:13,color:"#64748b"}}>{f.specialty}</div>
        </div>
        <div className="dp-card">
          <FRow label="Name"><input style={inp} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FRow>
          <FRow label="Email"><input style={inp} value={f.email} disabled/></FRow>
          <FRow label="Phone"><input style={inp} value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></FRow>
          <FRow label="Specialty"><input style={inp} value={f.specialty} onChange={e=>setF({...f,specialty:e.target.value})}/></FRow>
          <FRow label="Location"><input style={inp} value={f.location} onChange={e=>setF({...f,location:e.target.value})}/></FRow>
          <FRow label="Bio"><textarea style={{...inp,height:80,resize:"vertical"}} value={f.bio} onChange={e=>setF({...f,bio:e.target.value})}/></FRow>
          <button className="dp-btn-primary" style={{width:"100%", marginTop: 12}} onClick={save}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}
