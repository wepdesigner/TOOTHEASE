import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Styles/Appointment.css";

const SERVICES = [
  "Consultation", "Oral Examination", "Dental Fillings", "Tooth Removal",
  "Teeth Cleaning", "Teeth Whitening", "Crowns",
  "Bridges", "X-Ray / Imaging", "Teeth Jewellery", "Braces", "Dentures",
  "Gum Therapy", "Night Guards", "Veneers", "Smile Makeover", "Root Canal",
  "Slimming Wires",
];

const TIMES = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

const todayStr = () => new Date().toISOString().split("T")[0];

const AV_COLORS = ["#1e88e5","#00bfa5","#7c3aed","#e85c4a","#ff7043","#0891b2","#16a34a","#be185d"];
function Avatar({ name = "?", size = 40 }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const bg = AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];
  return (
    <div className="appt-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="appt-field">
      <label>{label}</label>
      {children}
      {error && <div className="appt-field-err">{error}</div>}
    </div>
  );
}

export default function Appointment() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Data from backend
  const [doctors, setDoctors] = useState([]);
  
  // Form State
  const [form, setForm] = useState({
    name:"", phone:"", email:"", service:"", doctorId:"", date:"", time:"", notes:"",
    reasonForVisit: "", symptomsDuration: "", allergies: "", currentMedications: "", emergencyContact: "",
    paymentOperator: "MTN Mobile Money", paymentNumber: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedAppt, setBooked] = useState(null);
  const [step, setStep] = useState(1); // 1=Contact, 2=Intake, 3=Doctor, 4=Payment

  useEffect(() => {
    // Force Authentication
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to book an appointment.");
      navigate("/login");
      return;
    }
    
    // Fetch Profile and Doctors
    const fetchData = async () => {
      try {
        const { data: profileData } = await API.get("/auth/me");
        if (profileData.success) {
          setUser(profileData.user);
          setForm(f => ({
            ...f,
            name: profileData.user.name || "",
            email: profileData.user.email || "",
            phone: profileData.user.phone || "",
            allergies: profileData.user.allergies || "",
            emergencyContact: profileData.user.emergency || ""
          }));
        }

        const { data: docData } = await API.get("/doctors");
        if (docData.success) {
          setDoctors(docData.doctors.filter(d => d.status === "ACTIVE" || d.status === "active"));
        }
      } catch (err) {
        console.error("Fetch err:", err);
      }
    };
    fetchData();
  }, [navigate]);

  const selDoc = doctors.find(d => (d._id || d.id) === form.doctorId);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const nextStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Name required";
      if (!form.phone.trim()) e.phone = "Phone required";
      if (!form.service) e.service = "Choose a service";
      if (!form.date) e.date = "Pick a date";
      if (!form.time) e.time = "Pick a time";
    }
    if (step === 2) {
      if (!form.reasonForVisit.trim()) e.reasonForVisit = "Please provide a reason";
    }
    if (step === 3) {
      if (!form.doctorId) e.doctorId = "Select a doctor";
    }
    
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.paymentNumber.trim() && form.paymentOperator !== "VISA") errs.paymentNumber = "Required for Mobile Money";
    if (!form.paymentNumber.trim() && form.paymentOperator === "VISA") errs.paymentNumber = "Card number required";
    
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    
    // Simulate Payment Gateway
    await new Promise(r => setTimeout(r, 2000)); 

    try {
      const payload = {
        doctorId: form.doctorId,
        healthType: form.service,
        date: form.date,
        time: form.time,
        notes: form.notes + "\nReason: " + form.reasonForVisit + "\nSymptoms: " + form.symptomsDuration + "\nAllergies: " + form.allergies + "\nMedications: " + form.currentMedications,
        paymentMethod: form.paymentOperator,
        paymentStatus: "COMPLETED"
      };
      
      const { data } = await API.post("/appointments", payload);
      
      if (data.success) {
        setBooked({ ...payload, _id: data.appointment._id, doctorName: selDoc?.userId?.name || "Doctor", amount: selDoc?.consultFee || 15000 });
        setSuccess(true);
      } else {
        alert("Booking failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during booking.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    navigate("/patientpanel"); // redirect to patient panel
  };

  if (!user) return <div style={{padding: 100, textAlign: "center"}}>Loading secure booking portal...</div>;

  return (
    <div className="appt-root">
      <section className="appt-hero">
        <div className="appt-hero-overlay"/>
        <div className="appt-hero-particles">
          {[...Array(14)].map((_, i) => <div key={i} className="particle" style={{ "--i": i }}/>)}
        </div>
        <div className="appt-hero-content">
          <nav className="appt-breadcrumb">
            <Link to="/"><span>Home</span></Link>
            <span className="sep">›</span>
            <span className="current">Book Appointment</span>
          </nav>
          <h1 className="appt-hero-title">Book an Appointment</h1>
          <p className="appt-hero-sub">Complete clinical intake and secure your spot.</p>
        </div>
      </section>

      <section className="appt-form-section">
        <div className="appt-form-wrap" style={{gridTemplateColumns: "1fr"}}>
          <div className="appt-form-right" style={{maxWidth: 800, margin: "0 auto", width: "100%"}}>
            {success ? (
              <div className="appt-success-card">
                <div className="appt-success-icon">✓</div>
                <h2>Booking & Payment Confirmed!</h2>
                <p>Your appointment with Dr. {bookedAppt?.doctorName} is confirmed.</p>
                <div style={{background: "#f8fafc", padding: 20, borderRadius: 8, marginTop: 20, textAlign: "left"}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}><span>Service:</span> <strong>{bookedAppt?.healthType}</strong></div>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}><span>Date & Time:</span> <strong>{bookedAppt?.date} at {bookedAppt?.time}</strong></div>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}><span>Amount Paid:</span> <strong>{bookedAppt?.amount} FCFA</strong></div>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}><span>Payment Method:</span> <strong>{bookedAppt?.paymentMethod}</strong></div>
                </div>
                <button className="appt-btn appt-btn-primary" style={{marginTop: 30}} onClick={reset}>Go to My Appointments</button>
              </div>
            ) : (
              <>
                <div className="appt-steps" style={{gridTemplateColumns: "repeat(4, 1fr)"}}>
                  {["Basic Details","Clinical Intake","Select Doctor","Payment"].map((s, i) => (
                    <div key={s} className={`appt-step ${step === i+1 ? "active" : step > i+1 ? "done" : ""}`}>
                      <div className="appt-step-dot">{step > i+1 ? "✓" : i+1}</div>
                      <span style={{fontSize: 12}}>{s}</span>
                      {i < 3 && <div className="appt-step-line"/>}
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd"><h3>Your Information</h3></div>
                    <div className="appt-form-grid">
                      <Field label="Full Name *" error={errors.name}>
                        <input className="appt-input" value={form.name} onChange={e=>set("name",e.target.value)} disabled />
                      </Field>
                      <Field label="Phone Number *" error={errors.phone}>
                        <input className="appt-input" value={form.phone} onChange={e=>set("phone",e.target.value)}/>
                      </Field>
                      <Field label="Treatment Type *" error={errors.service}>
                        <select className="appt-input appt-select" value={form.service} onChange={e=>set("service",e.target.value)}>
                          <option value="">Choose treatment...</option>
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Preferred Date *" error={errors.date}>
                        <input className="appt-input" type="date" min={todayStr()} value={form.date} onChange={e=>set("date",e.target.value)}/>
                      </Field>
                      <Field label="Preferred Time *" error={errors.time}>
                        <select className="appt-input appt-select" value={form.time} onChange={e=>set("time",e.target.value)}>
                          <option value="">Select a time...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="appt-form-acts"><button className="appt-btn appt-btn-primary" onClick={nextStep}>Next Step →</button></div>
                  </div>
                )}

                {step === 2 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd"><h3>Clinical Intake</h3><p>Traditional patient recording form details.</p></div>
                    <div className="appt-form-grid" style={{gridTemplateColumns: "1fr"}}>
                      <Field label="Reason for Visit (Primary Complaint) *" error={errors.reasonForVisit}>
                        <textarea className="appt-input" style={{height:80, resize:"vertical"}} value={form.reasonForVisit} onChange={e=>set("reasonForVisit",e.target.value)} placeholder="Describe why you are booking this appointment..."/>
                      </Field>
                      <Field label="Duration of Symptoms">
                        <input className="appt-input" value={form.symptomsDuration} onChange={e=>set("symptomsDuration",e.target.value)} placeholder="e.g. 3 days, 2 weeks..."/>
                      </Field>
                      <Field label="Known Allergies">
                        <input className="appt-input" value={form.allergies} onChange={e=>set("allergies",e.target.value)} placeholder="e.g. Penicillin, Peanuts..."/>
                      </Field>
                      <Field label="Current Medications">
                        <input className="appt-input" value={form.currentMedications} onChange={e=>set("currentMedications",e.target.value)} placeholder="List any drugs you take currently..."/>
                      </Field>
                      <Field label="Emergency Contact (Name / Phone)">
                        <input className="appt-input" value={form.emergencyContact} onChange={e=>set("emergencyContact",e.target.value)} placeholder="Contact person..."/>
                      </Field>
                    </div>
                    <div className="appt-form-acts" style={{justifyContent:"space-between"}}>
                      <button className="appt-ghost-btn" onClick={() => setStep(1)}>← Back</button>
                      <button className="appt-btn appt-btn-primary" onClick={nextStep}>Next Step →</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd"><h3>Select a Doctor</h3></div>
                    {errors.doctorId && <div style={{color:"#ef4444", marginBottom: 16, fontWeight: 600}}>{errors.doctorId}</div>}
                    <div className="appt-doc-list">
                      {doctors.length === 0 && <p>No doctors available.</p>}
                      {doctors.map(d => (
                        <div key={d._id||d.id} className={`appt-doc-sel ${form.doctorId===(d._id||d.id) ? "active" : ""}`} onClick={() => set("doctorId", d._id||d.id)} style={{display:"flex", alignItems:"center", gap:16, padding:16, border:"1px solid var(--appt-border)", borderRadius:8, marginBottom:12, cursor:"pointer"}}>
                          <Avatar name={d.userId?.name || d.name} size={48}/>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700, fontSize:16, color:"var(--appt-dark)"}}>Dr. {d.userId?.name || d.name}</div>
                            <div style={{fontSize:13, color:"var(--appt-muted)"}}>{d.specialty} • {d.experience}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700, color:"var(--appt-primary)"}}>{d.consultFee || 15000} FCFA</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="appt-form-acts" style={{justifyContent:"space-between", marginTop: 24}}>
                      <button className="appt-ghost-btn" onClick={() => setStep(2)}>← Back</button>
                      <button className="appt-btn appt-btn-primary" onClick={nextStep}>Proceed to Payment →</button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="appt-form-card appt-anim">
                    <div className="appt-form-card-hd"><h3>Payment Validation</h3><p>Securely pay to confirm your appointment.</p></div>
                    
                    <div style={{background:"#f8fafc", border:"1px solid #e2e8f0", padding:16, borderRadius:8, marginBottom:24, display:"flex", justifyContent:"space-between"}}>
                      <span style={{fontSize:16, color:"#64748b"}}>Total Due:</span>
                      <strong style={{fontSize:20, color:"#0f172a"}}>{selDoc?.consultFee || 15000} FCFA</strong>
                    </div>

                    <div className="appt-form-grid" style={{gridTemplateColumns: "1fr"}}>
                      <Field label="Payment Operator" error={errors.paymentOperator}>
                        <select className="appt-input appt-select" value={form.paymentOperator} onChange={e=>set("paymentOperator",e.target.value)}>
                          <option>MTN Mobile Money</option>
                          <option>ORANGE Money</option>
                          <option>VISA</option>
                        </select>
                      </Field>
                      
                      <Field label={form.paymentOperator === "VISA" ? "Card Number *" : "Mobile Money Number *"} error={errors.paymentNumber}>
                        <div style={{display:"flex", alignItems:"center", gap: 12}}>
                          <div style={{width: 50, height: 32, background:"#e2e8f0", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:"#475569"}}>
                            {form.paymentOperator.split(" ")[0]}
                          </div>
                          <input className="appt-input" style={{flex:1}} value={form.paymentNumber} onChange={e=>set("paymentNumber",e.target.value)} placeholder={form.paymentOperator === "VISA" ? "XXXX XXXX XXXX XXXX" : "6XX XXX XXX"}/>
                        </div>
                      </Field>
                    </div>

                    <div className="appt-form-acts" style={{justifyContent:"space-between", marginTop: 24}}>
                      <button className="appt-ghost-btn" disabled={loading} onClick={() => setStep(3)}>← Back</button>
                      <button className="appt-btn appt-btn-primary" disabled={loading} onClick={submit} style={{display:"flex", alignItems:"center", gap:8}}>
                        {loading ? <span className="appt-spinner" style={{width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 1s linear infinite"}}/> : null}
                        {loading ? "Processing Payment..." : "Pay & Complete Booking"}
                      </button>
                    </div>
                    
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
