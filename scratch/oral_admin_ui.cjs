const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/Pages/Admin/ApiAdminPanel.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Recharts imports at the top
if (!content.includes('recharts')) {
  content = content.replace(
    'import AdminMemberships from "./AdminMemberships";',
    'import AdminMemberships from "./AdminMemberships";\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";'
  );
}

// 2. Update CSS Block for Oral Admin
const oldCSSMatch = content.match(/const CSS = `([\s\S]*?)`;/);
if (oldCSSMatch) {
  const newCSS = `const CSS = \`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
:root{--sw:240px;--bg:#f8fafc;--blue:#2563eb;--text-dark:#0f172a;--text-gray:#64748b;--border:#e2e8f0;--card:#ffffff;--chart-1:#3b82f6;--chart-2:#10b981;--chart-3:#f59e0b;--chart-4:#ef4444;}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',sans-serif;}

/* App Wrapper */
.dp-root{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--text-dark);}

/* Sidebar */
.dp-sidebar{width:var(--sw);background:var(--card);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200;border-right:1px solid var(--border);}
.dp-brand{display:flex;align-items:center;gap:12px;padding:24px;flex-shrink:0}
.dp-brand img{width:32px;height:32px;object-fit:contain}
.dp-brand-text{font-size:20px;font-weight:800;color:var(--text-dark);letter-spacing:-0.5px}

.dp-nav{flex:1;padding:12px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.dp-nav-item{display:flex;align-items:center;gap:14px;width:100%;padding:10px 16px;background:none;border:none;cursor:pointer;color:var(--text-gray);font-size:14px;font-weight:600;text-align:left;position:relative;transition:all 0.2s;border-radius:12px;}
.dp-nav-item:hover{background:#f1f5f9;color:var(--text-dark)}
.dp-nav-item.active{background:var(--blue);color:#fff;}
.dp-nav-item.active:hover{color:#fff}
.dp-nav-icon{font-size:18px;width:24px;text-align:center;display:flex;align-items:center;justify-content:center}

.dp-logout{margin:16px;padding:12px 16px;background:#fef2f2;border-radius:12px;border:none;cursor:pointer;color:#ef4444;font-size:14px;font-weight:700;text-align:center;transition:all .2s;}
.dp-logout:hover{background:#fee2e2}

/* Main Area */
.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.dp-topbar{height:80px;background:var(--bg);display:flex;align-items:center;padding:0 32px;flex-shrink:0;z-index:100;justify-content:space-between}
.dp-topbar-title{font-size:24px;font-weight:800;color:var(--text-dark);letter-spacing:-0.5px}
.dp-top-right{display:flex;align-items:center;gap:16px}
.dp-search{background:#fff;border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;width:260px;border:1px solid var(--border);box-shadow:0 1px 2px rgba(0,0,0,0.02)}
.dp-search input{border:none;background:none;outline:none;font-size:13px;width:100%;font-weight:500}
.dp-period-btn{background:#fff;border:1px solid var(--border);border-radius:12px;padding:10px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.02)}

.dp-content{flex:1;overflow-y:auto;padding:0 32px 32px;}
.dp-anim{animation:dpFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1)}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Oral Admin Grid */
.oa-grid{display:grid;grid-template-columns:repeat(12, 1fr);gap:24px;margin-bottom:24px}
.oa-card{background:var(--card);border-radius:20px;padding:24px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.oa-card-title{font-size:15px;font-weight:700;color:var(--text-dark);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}

/* Mini Stat Cards */
.oa-stat-card{background:var(--card);border-radius:16px;padding:20px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between}
.oa-stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
.oa-stat-icon{width:40px;height:40px;border-radius:12px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--blue)}
.oa-stat-num{font-size:28px;font-weight:800;color:var(--text-dark);line-height:1;margin-bottom:8px}
.oa-stat-label{font-size:13px;font-weight:600;color:var(--text-gray)}
.oa-trend{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700}
.oa-trend.up{color:#10b981}
.oa-trend.down{color:#ef4444}

/* Approvals / Users List */
.oa-list-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9}
.oa-list-item:last-child{border-bottom:none;padding-bottom:0}
.oa-list-user{display:flex;align-items:center;gap:12px}
.oa-list-name{font-size:14px;font-weight:700;color:var(--text-dark)}
.oa-list-sub{font-size:12px;font-weight:500;color:var(--text-gray)}

.dp-btn-outline{border:1px solid var(--border);background:transparent;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:var(--text-dark)}
.dp-btn-outline:hover{background:#f1f5f9}

@media(max-width:1280px){
  .oa-grid{grid-template-columns:1fr}
}
\`;`;
  content = content.replace(oldCSSMatch[0], newCSS);
}

// 3. Update the Topbar in the Shell
content = content.replace(
  /<div className="dp-topbar-title">[\s\S]*?<\/header>/m,
  `<div className="dp-topbar-title">
            Welcome Back, {sessionUser?.name?.split(" ")[0] || "Dr. John"}!
          </div>
          <div className="dp-top-right">
            <div className="dp-search">
              <i className="ti ti-search" style={{color:"#94a3b8", fontSize:18}}/>
              <input type="text" placeholder="Search..." />
            </div>
            <button className="dp-period-btn">Period: Monthly <i className="ti ti-chevron-down"/></button>
            <Avatar name={sessionUser?.name || "Admin"} size={40}/>
          </div>
        </header>`
);

// 4. Completely replace AdminOverview
const overviewRegex = /function AdminOverview\(\{ stats, recent, admin \}\) \{([\s\S]*?)return \([\s\S]*?\);\n\}/m;
const newOverview = `function AdminOverview({ stats, recent, admin }) {
  // Recharts Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const mAppts = stats?.monthlyAppointments || [];
  const pTreat = stats?.treatmentStats || [];
  const sRates = stats?.successRates || [];
  const tAppts = stats?.todaysAppointments || [];

  return (
    <div className="dp-anim">
      {/* TOP ROW: Stats & Main Chart */}
      <div className="oa-grid">
        {/* 4 Stat Cards */}
        <div style={{gridColumn:"span 5", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#eff6ff"}}><i className="ti ti-users"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +12%</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.totalPatients || 0}</div>
              <div className="oa-stat-label">Total Patients</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#ecfdf5", color:"#10b981"}}><i className="ti ti-stethoscope"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +2</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.activeDoctors || 0}</div>
              <div className="oa-stat-label">Active Doctors</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#fef2f2", color:"#ef4444"}}><i className="ti ti-calendar-clock"/></div>
              <div className="oa-trend down"><i className="ti ti-trending-down"/> -5%</div>
            </div>
            <div>
              <div className="oa-stat-num">{stats?.pendingAppointments || 0}</div>
              <div className="oa-stat-label">Pending Appointments</div>
            </div>
          </div>
          <div className="oa-stat-card">
            <div className="oa-stat-top">
              <div className="oa-stat-icon" style={{background:"#fffbeb", color:"#f59e0b"}}><i className="ti ti-currency-dollar"/></div>
              <div className="oa-trend up"><i className="ti ti-trending-up"/> +8%</div>
            </div>
            <div>
              <div className="oa-stat-num">{(stats?.totalRevenue||0).toLocaleString()}</div>
              <div className="oa-stat-label">Revenue (XAF)</div>
            </div>
          </div>
        </div>

        {/* Appointment Bar Chart */}
        <div className="oa-card" style={{gridColumn:"span 7", display:"flex", flexDirection:"column"}}>
          <div className="oa-card-title">
            <span>Appointment Activity</span>
            <button className="dp-btn-outline">Export</button>
          </div>
          <div style={{flex:1, minHeight:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mAppts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Legend iconType="circle" wrapperStyle={{fontSize:12, paddingTop:20}}/>
                <Bar dataKey="Booked" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Canceled" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="oa-grid">
        {/* Top Treatments Pie */}
        <div className="oa-card" style={{gridColumn:"span 4"}}>
          <div className="oa-card-title">Top Treatments</div>
          <div style={{height: 200}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pTreat} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pTreat.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Patient Details (Mock profile) */}
        <div className="oa-card" style={{gridColumn:"span 4"}}>
          <div className="oa-card-title">New Patient Details</div>
          <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:20}}>
            <Avatar name="Sophia Lauren" size={50} />
            <div>
              <div style={{fontSize:16, fontWeight:800, color:"var(--text-dark)"}}>Sophia Lauren</div>
              <div style={{fontSize:13, color:"var(--text-gray)", fontWeight:500}}>Registered Today</div>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:13}}>
            <div><span style={{color:"var(--text-gray)"}}>Gender:</span> <br/><b>Female</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Age:</span> <br/><b>24 yrs</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Height:</span> <br/><b>165 cm</b></div>
            <div><span style={{color:"var(--text-gray)"}}>Weight:</span> <br/><b>55 kg</b></div>
          </div>
        </div>

        {/* Approval Requests */}
        <div className="oa-card" style={{gridColumn:"span 4", overflowY:"auto"}}>
          <div className="oa-card-title">Approval Requests</div>
          <div>
            {(!recent || recent.length===0) ? <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No requests</div> : recent.slice(0,3).map(r => (
              <div key={r._id} className="oa-list-item">
                <div className="oa-list-user">
                  <Avatar name={r.patientId?.name} size={36}/>
                  <div>
                    <div className="oa-list-name">{r.patientId?.name}</div>
                    <div className="oa-list-sub">{r.healthType}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12, fontWeight:700, color:"var(--text-dark)", marginBottom:4}}>{r.date?.split("T")[0]}</div>
                  <Badge label="PENDING" color="#f59e0b" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="oa-grid">
        {/* Today's Appointments */}
        <div className="oa-card" style={{gridColumn:"span 4", maxHeight: 300, overflowY:"auto"}}>
          <div className="oa-card-title">Today's Appointment <span style={{background:"#eff6ff", color:"#3b82f6", padding:"2px 8px", borderRadius:99, fontSize:12}}>{tAppts.length}</span></div>
          <div>
            {tAppts.length===0 ? <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No appointments today</div> : tAppts.map(a => (
              <div key={a._id} className="oa-list-item">
                <div>
                  <div className="oa-list-name">{a.healthType}</div>
                  <div className="oa-list-sub">{a.patientId?.name}</div>
                </div>
                <div style={{fontSize:12, fontWeight:700, color:"var(--text-dark)", background:"#f1f5f9", padding:"4px 10px", borderRadius:6}}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Rate Line Chart */}
        <div className="oa-card" style={{gridColumn:"span 4", display:"flex", flexDirection:"column"}}>
          <div className="oa-card-title">Success Rate</div>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
            <div style={{fontSize:32, fontWeight:800}}>90%</div>
            <div className="oa-trend up"><i className="ti ti-trending-up"/> +2%</div>
          </div>
          <div style={{flex:1, minHeight:120}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sRates}>
                <Tooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals & Revenue */}
        <div className="oa-card" style={{gridColumn:"span 4", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <div style={{fontSize:13, fontWeight:600, color:"var(--text-gray)"}}>Total Patients This Month</div>
            <div style={{fontSize:36, fontWeight:800, color:"var(--text-dark)", margin:"8px 0"}}>{Math.floor((stats?.totalPatients||0) / 4) + 12}</div>
            <button className="dp-btn-outline" style={{width:"max-content"}}>View More</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', justifyContent:'center', borderLeft:"1px solid var(--border)", paddingLeft:16}}>
            <div style={{fontSize:13, fontWeight:600, color:"var(--text-gray)"}}>Revenue (Month)</div>
            <div style={{fontSize:28, fontWeight:800, color:"var(--text-dark)", margin:"8px 0"}}>{Math.floor((stats?.totalRevenue||0) / 3).toLocaleString()}</div>
            <button className="dp-btn-outline" style={{width:"max-content"}}>View More</button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
if (content.match(overviewRegex)) {
  content = content.replace(overviewRegex, newOverview);
}

fs.writeFileSync(targetFile, content);
console.log("Upgraded ApiAdminPanel UI to Oral Admin Style with dynamic Recharts!");
