const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/Pages/Admin/ApiAdminPanel.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace the entire CSS block with Zendenta CSS
const oldCSSMatch = content.match(/const CSS = `([\s\S]*?)`;/);
if (oldCSSMatch) {
  const newCSS = `const CSS = \`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
:root{--sw:260px;--bg:#f4f7fe;--blue:#1a56db;--text-dark:#111827;--text-gray:#6b7280;--border:#e5e7eb;}
*{box-sizing:border-box;margin:0;padding:0;font-family:'Nunito',sans-serif;}

/* App Wrapper for that Mac-window look if desired, but we'll stick to full bleed */
.dp-root{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--text-dark);}

/* Sidebar */
.dp-sidebar{width:var(--sw);background:#fff;display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200;border-right:1px solid var(--border);}
.dp-brand{display:flex;align-items:center;gap:12px;padding:24px 28px;flex-shrink:0}
.dp-brand img{width:32px;height:32px;object-fit:contain}
.dp-brand-text{font-size:22px;font-weight:900;color:var(--text-dark);letter-spacing:-0.5px}

.dp-nav{flex:1;padding:12px 0;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.dp-nav-section{font-size:11px;font-weight:800;text-transform:uppercase;color:#9ca3af;padding:16px 28px 6px;letter-spacing:1px}
.dp-nav-item{display:flex;align-items:center;gap:14px;width:100%;padding:12px 28px;background:none;border:none;cursor:pointer;color:var(--text-gray);font-size:15px;font-weight:700;text-align:left;position:relative;transition:all 0.2s}
.dp-nav-item:hover{color:var(--blue)}
.dp-nav-item.active{background:var(--blue);color:#fff;border-radius:0 24px 24px 0;width:calc(100% - 16px)}
.dp-nav-item.active:hover{color:#fff}
.dp-nav-icon{font-size:18px;width:24px;text-align:center;display:flex;align-items:center;justify-content:center}

.dp-user-block{margin:0 16px 16px;padding:12px;border-top:1px solid var(--border);display:flex;gap:12px;align-items:center}
.dp-logout{width:100%;padding:16px 28px;background:none;border:none;cursor:pointer;color:#ef4444;font-size:15px;font-weight:700;text-align:left;transition:all .2s;display:flex;align-items:center;gap:14px}
.dp-logout:hover{background:#fef2f2}

/* Main Area */
.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.dp-topbar{height:76px;background:transparent;display:flex;align-items:center;padding:0 36px;flex-shrink:0;z-index:100;gap:20px}
.dp-topbar-title{font-size:22px;font-weight:800;color:var(--text-dark);display:flex;align-items:center;gap:10px}
.dp-search{background:#fff;border-radius:999px;padding:10px 20px;display:flex;align-items:center;gap:10px;width:300px;border:1px solid var(--border)}
.dp-search input{border:none;background:none;outline:none;font-size:14px;width:100%;font-family:'Nunito'}
.dp-top-actions{display:flex;align-items:center;gap:16px}
.dp-icon-btn{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;position:relative}
.dp-btn-blue{background:var(--blue);color:#fff;font-size:20px;box-shadow:0 4px 10px rgba(26,86,219,0.2)}
.dp-btn-gray{background:#fff;color:var(--text-gray);font-size:20px;border:1px solid var(--border)}
.dp-dot{position:absolute;top:10px;right:12px;width:8px;height:8px;background:#ef4444;border-radius:50%;border:2px solid #fff}

.dp-content{flex:1;overflow-y:auto;padding:0 36px 36px;}
.dp-anim{animation:dpFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1)}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* Zendenta Dashboard Grid */
.zen-grid-top{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:24px}
.zen-hero{background:#1e293b;border-radius:24px;padding:32px;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;min-height:300px}
.zen-hero-title{font-size:28px;font-weight:800;margin-bottom:24px;position:relative;z-index:2}
.zen-chart-mock{flex:1;display:flex;align-items:flex-end;gap:12px;position:relative;z-index:2;margin-top:20px}
.zen-bar{flex:1;background:rgba(255,255,255,0.1);border-radius:6px 6px 0 0;position:relative}
.zen-bar-inner{position:absolute;bottom:0;left:0;right:0;background:#3b82f6;border-radius:6px 6px 0 0;}
.zen-bar-inner.red{background:#ef4444;}
.zen-month{position:absolute;bottom:-24px;left:50%;transform:translateX(-50%);font-size:12px;color:rgba(255,255,255,0.5);font-weight:700}

.zen-side-cards{display:flex;flex-direction:column;gap:24px}
.zen-card{background:#fff;border-radius:20px;padding:24px;border:1px solid var(--border)}
.zen-card-title{font-size:12px;font-weight:800;color:var(--text-gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
.zen-card-big-num{font-size:42px;font-weight:900;color:var(--text-dark);line-height:1;margin-bottom:8px}
.zen-card-sub{font-size:14px;color:var(--text-gray);font-weight:600}
.zen-more-btn{display:inline-flex;align-items:center;gap:8px;background:#f3f4f6;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:700;color:var(--text-dark);text-decoration:none;cursor:pointer;margin-top:16px;border:none}
.zen-more-btn .circle{width:20px;height:20px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px}

.zen-grid-bottom{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}

/* Tables & Forms from previous */
.dp-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px;}
.dp-title{font-weight:800;font-size:28px;color:var(--text-dark)}
.dp-tbl-wrap{overflow-x:auto;background:#fff;border-radius:20px;border:1px solid var(--border)}
.dp-table{width:100%;border-collapse:collapse;font-size:14px;background:#fff}
.dp-table th{text-align:left;padding:16px 24px;border-bottom:1px solid var(--border);font-size:12px;font-weight:800;color:var(--text-gray);text-transform:uppercase;letter-spacing:0.5px}
.dp-table td{padding:16px 24px;border-bottom:1px solid #f3f4f6;color:var(--text-dark);font-weight:600}
.dp-btn-primary{background:var(--blue);color:#fff;border:none;padding:10px 24px;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(26,86,219,0.2)}
.dp-ghost{background:#f3f4f6;border:none;padding:8px 16px;border-radius:999px;font-weight:700;font-size:13px;color:var(--text-dark);cursor:pointer}

@media(max-width:1024px){
  .zen-grid-bottom{grid-template-columns:repeat(2,1fr)}
  .zen-grid-top{grid-template-columns:1fr}
}
@media(max-width:640px){
  .dp-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%);height:100vh;z-index:300}
  .dp-sidebar.open{transform:translateX(0)}
  .dp-topbar{padding:0 20px}
  .dp-content{padding:0 20px 20px}
  .zen-grid-bottom{grid-template-columns:1fr}
}
\`;`;
  content = content.replace(oldCSSMatch[0], newCSS);
}

// 2. Replace the main shell layout (Sidebar, Topbar)
const shellRegex = /return \(\s*<div style={{ display:"flex", height:"100vh"[\s\S]*?\{sideOpen && <div className="dp-overlay" onClick=\{\(\) => setSideOpen\(false\)\}\/>\}\s*<\/div>\s*\);/m;
const newShell = `return (
    <div className="dp-root">
      <style>{CSS}</style>

      <aside className={\`dp-sidebar\${sideOpen?" open":""}\`}>
        <div className="dp-brand">
          <img src="/logo.png" alt="Zendenta Logo" style={{ filter: "brightness(0) invert(0)" }} onError={(e)=>{e.target.style.display='none';}} />
          <div className="dp-brand-text">STECH</div>
        </div>
        
        <nav className="dp-nav">
          {NAV.map((n,i) => {
            if (n.section) return null; // Hide sections for a cleaner look
            return (
              <button key={n.key} className={\`dp-nav-item\${tab===n.key?" active":""}\`} onClick={() => { setTab(n.key); setSideOpen(false); }}>
                <span className="dp-nav-icon"><i className={\`ti ti-\${n.icon}\`}/></span>
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="dp-user-block">
          <Avatar name={sessionUser?.name || "Admin"} size={44}/>
          <div style={{ overflow:"hidden" }}>
            <div style={{ color:"var(--text-dark)", fontWeight:800, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sessionUser?.name || "Dr. Adam"}</div>
            <div style={{ color:"var(--text-gray)", fontSize:12, fontWeight:600 }}>Administrator</div>
          </div>
        </div>
      </aside>

      <div className="dp-main">
        <header className="dp-topbar">
          <button className="dp-hamburger" onClick={() => setSideOpen(s=>!s)} style={{display:'none'}}><i className="ti ti-menu-2"/></button>
          
          <div className="dp-topbar-title">
            <i className="ti ti-dashboard" style={{color:"var(--blue)", fontSize:26}}/>
            Dashboard Overview
          </div>
          
          <div style={{ flex:1 }}/>
          
          <div className="dp-search">
            <i className="ti ti-search" style={{color:"#9ca3af", fontSize:18}}/>
            <input type="text" placeholder="Search..." />
          </div>

          <div className="dp-top-actions">
            <button className="dp-icon-btn dp-btn-blue"><i className="ti ti-plus"/></button>
            <button className="dp-icon-btn dp-btn-gray">
              <i className="ti ti-bell"/>
              <div className="dp-dot"/>
            </button>
          </div>
        </header>

        <main className="dp-content">
          {tab==="overview" && <AdminOverview stats={stats} recent={recentActivity} admin={sessionUser} />}
          {tab==="doctors" && <AdminDoctors />}
          {tab==="patients" && <AdminPatients />}
          {tab==="appointments" && <AdminAppointments />}
          {tab==="payments" && <AdminPayments />}
          {tab==="memberships" && <AdminMemberships />}
        </main>
      </div>

      {sideOpen && <div className="dp-overlay" onClick={() => setSideOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:250}}/>}
    </div>
  );`;
if(content.match(shellRegex)) {
  content = content.replace(shellRegex, newShell);
}

// 3. Update NAV icons to Tabler Icons
content = content.replace(/"DB"/g, '"layout-dashboard"');
content = content.replace(/"DR"/g, '"stethoscope"');
content = content.replace(/"PT"/g, '"users"');
content = content.replace(/"AP"/g, '"calendar-event"');
content = content.replace(/"PA"/g, '"cash"');
content = content.replace(/"MR"/g, '"chart-bar"');

// 4. Redesign AdminOverview
const overviewRegex = /function AdminOverview\(\{ stats, recent, admin \}\) \{([\s\S]*?)return \([\s\S]*?\);\n\}/m;
const newOverview = `function AdminOverview({ stats, recent, admin }) {
  const hr = new Date().getHours();
  const gr = hr<12?"Morning":hr<18?"Afternoon":"Evening";

  // Mock bar chart heights for Zendenta UI feel
  const bars = [30, 45, 20, 60, 80, 50, 40, 70, 45, 60, 30, 55];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="dp-anim">
      <div className="zen-grid-top">
        {/* Dark Hero Banner */}
        <div className="zen-hero">
          <div className="zen-hero-title">Good {gr}, {admin?.name?.split(" ")[0] || "Dr Adam"}.</div>
          <div style={{fontSize:12, fontWeight:700, letterSpacing:1, color:"rgba(255,255,255,0.6)", textTransform:"uppercase"}}>Appointment Statistics</div>
          
          <div className="zen-chart-mock">
            {bars.map((h, i) => (
              <div key={i} className="zen-bar" style={{ height: '180px' }}>
                <div className={\`zen-bar-inner \${i%4===0?'red':''}\`} style={{ height: \`\${h}%\` }} />
                <div className="zen-month">{months[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Cards */}
        <div className="zen-side-cards">
          <div className="zen-card">
            <div className="zen-card-title">Pending Appointments</div>
            <div className="zen-card-big-num">{stats.pendingAppointments || 0}</div>
            <div className="zen-card-sub">Requests waiting to approve</div>
            <button className="zen-more-btn">More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
          </div>

          <div className="zen-card">
            <div className="zen-card-title">Clinic Information</div>
            <div style={{display:'flex', gap:12, marginBottom:12, color:"var(--text-gray)", fontSize:14, fontWeight:600}}>
              <i className="ti ti-building" style={{fontSize:18, color:"var(--text-dark)"}}/>
              <span>Douala, Cameroon - STECH Main Branch</span>
            </div>
            <div style={{display:'flex', gap:12, color:"var(--text-gray)", fontSize:14, fontWeight:600}}>
              <i className="ti ti-phone" style={{fontSize:18, color:"var(--text-dark)"}}/>
              <span>+237 600 00 00 00</span>
            </div>
            <button className="zen-more-btn">More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="zen-grid-bottom">
        <div className="zen-card">
          <div className="zen-card-title">Today's Appointment</div>
          <div className="zen-card-big-num" style={{display:'flex', alignItems:'center', gap:16}}>
            4
            <div style={{display:'flex', flexDirection:'column', gap:8, flex:1}}>
              <div style={{background:'#f3f4f6', padding:6, borderRadius:8, fontSize:11, fontWeight:700, color:"var(--text-dark)"}}>Consultation <span style={{float:'right',color:"var(--text-gray)"}}>09:00</span></div>
              <div style={{background:'#f3f4f6', padding:6, borderRadius:8, fontSize:11, fontWeight:700, color:"var(--text-dark)"}}>Scaling <span style={{float:'right',color:"var(--text-gray)"}}>11:00</span></div>
            </div>
          </div>
          <button className="zen-more-btn">More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
        </div>

        <div className="zen-card">
          <div className="zen-card-title">Top Treatment</div>
          <div style={{fontSize:13, fontWeight:700, color:"var(--text-dark)", lineHeight:1.8}}>
            1. Consultation<br/>
            2. Scaling<br/>
            3. Root Canal<br/>
            4. Bleaching
          </div>
          <button className="zen-more-btn" style={{marginTop:8}}>More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
        </div>

        <div className="zen-card">
          <div className="zen-card-title">Total Patients</div>
          <div className="zen-card-big-num">{stats.totalPatients}</div>
          <div className="zen-card-sub" style={{marginBottom:16}}>Total Patients All Time</div>
          <button className="zen-more-btn">More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
        </div>

        <div className="zen-card">
          <div className="zen-card-title">Revenue</div>
          <div className="zen-card-big-num" style={{fontSize:28}}>{stats.totalRevenue?.toLocaleString("fr-CM")||0}</div>
          <div className="zen-card-sub" style={{marginBottom:16}}>Total Revenue XAF</div>
          <button className="zen-more-btn">More <div className="circle"><i className="ti ti-chevron-right"/></div></button>
        </div>
      </div>
    </div>
  );
}`;
if(content.match(overviewRegex)) {
  content = content.replace(overviewRegex, newOverview);
}


fs.writeFileSync(targetFile, content);
console.log("Upgraded ApiAdminPanel UI to Zendenta Style!");
