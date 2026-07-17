const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/Pages/Admin/ApiAdminPanel.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Upgrade the CSS block
const oldCSSMatch = content.match(/const CSS = `([\s\S]*?)`;/);
if (oldCSSMatch) {
  const newCSS = `const CSS = \`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
:root{--sw:270px;--slate-900:#0f172a;--slate-800:#1e293b;--slate-100:#f1f5f9;--indigo-600:#4f46e5;--indigo-500:#6366f1;}
*{box-sizing:border-box;margin:0;padding:0}

.dp-sidebar{width:var(--sw);background:var(--slate-900);display:flex;flex-direction:column;height:100vh;flex-shrink:0;overflow-y:auto;transition:transform .28s;position:relative;z-index:200;border-right:1px solid rgba(255,255,255,0.05)}
.dp-brand{display:flex;align-items:center;gap:12px;padding:28px 24px 20px;flex-shrink:0}
.dp-brand-orb{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg, var(--indigo-500), #8b5cf6);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;font-weight:900;box-shadow:0 4px 12px rgba(99,102,241,0.3)}
.dp-nav{flex:1;padding:12px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.dp-nav-section{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.4);padding:16px 12px 6px;font-family:'Inter',sans-serif}
.dp-nav-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);font-size:14px;font-weight:500;font-family:'Inter',sans-serif;text-align:left;border-radius:10px;transition:all .2s ease}
.dp-nav-item:hover{background:rgba(255,255,255,.05);color:#fff}
.dp-nav-item.active{background:var(--indigo-600);color:#fff;box-shadow:0 4px 12px rgba(79,70,229,0.25)}
.dp-nav-icon{font-size:15px;width:24px;text-align:center;display:flex;align-items:center;justify-content:center}
.dp-logout{width:100%;padding:16px 24px;background:var(--slate-800);border:none;cursor:pointer;color:rgba(255,255,255,.7);font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:left;transition:all .2s;border-top:1px solid rgba(255,255,255,.05)}
.dp-logout:hover{background:rgba(239,68,68,.1);color:#ef4444}

.dp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--slate-100)}
.dp-topbar{height:70px;background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;padding:0 32px;flex-shrink:0;z-index:100}
.dp-hamburger{display:none;background:none;border:none;cursor:pointer;font-size:20px;color:var(--slate-800)}
.dp-content{flex:1;overflow-y:auto;padding:32px;font-family:'Inter',sans-serif}

.dp-anim{animation:dpFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1)}
@keyframes dpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

.dp-page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:32px;flex-wrap:wrap}
.dp-title{font-family:'Outfit',sans-serif;font-weight:800;font-size:32px;color:var(--slate-900);letter-spacing:-0.5px}
.dp-sub{font-size:15px;color:#64748b;margin-top:6px;font-weight:400}

.dp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:32px}
.dp-stat-card{background:#fff;border:1px solid rgba(0,0,0,0.04);border-radius:20px;padding:24px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.02), 0 4px 10px -5px rgba(0,0,0,0.01);position:relative;overflow:hidden;transition:transform 0.2s}
.dp-stat-card:hover{transform:translateY(-2px)}
.dp-stat-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--acc,var(--indigo-500));border-radius:4px 0 0 4px}

.dp-card{background:#fff;border:1px solid rgba(0,0,0,0.04);border-radius:24px;padding:28px;box-shadow:0 10px 30px -10px rgba(0,0,0,0.03)}
.dp-card-head{margin-bottom:20px}
.dp-card-title{font-family:'Outfit',sans-serif;font-weight:800;font-size:18px;color:var(--slate-900)}

.dp-tbl-wrap{overflow-x:auto;margin-top:16px;border-radius:12px;border:1px solid #e2e8f0}
.dp-table{width:100%;border-collapse:collapse;font-size:14px;background:#fff}
.dp-table th{text-align:left;padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;position:sticky;top:0}
.dp-table td{padding:16px 20px;border-bottom:1px solid #f1f5f9;color:var(--slate-800);font-weight:500}
.dp-table tr:hover td{background:#f8fafc}
.dp-table tr:last-child td{border-bottom:none}

.dp-empty{text-align:center;padding:60px;color:#94a3b8;font-weight:500;font-size:15px}
.dp-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);z-index:100}
.dp-ghost{background:none;border:1px solid #e2e8f0;padding:8px 16px;border-radius:10px;font-weight:600;font-size:13px;color:#64748b;cursor:pointer;transition:all 0.2s}
.dp-ghost:hover{background:#f1f5f9;color:var(--slate-900)}
.dp-btn-primary{background:var(--indigo-600);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.2);transition:all 0.2s}
.dp-btn-primary:hover{background:var(--indigo-500);box-shadow:0 6px 16px rgba(79,70,229,0.3)}

@media(max-width:1024px){
  .dp-stats{grid-template-columns:1fr 1fr}
}
@media(max-width:640px){
  .dp-sidebar{position:fixed;left:0;top:0;transform:translateX(-100%);height:100vh;z-index:300}
  .dp-sidebar.open{transform:translateX(0)}
  .dp-overlay{display:block}
  .dp-hamburger{display:block}
  .dp-stats{grid-template-columns:1fr}
  .dp-content{padding:20px}
}
\`;`;
  content = content.replace(oldCSSMatch[0], newCSS);
}

// 2. Enhance Badge component
const oldBadgeMatch = content.match(/function Badge\(\{ label, color \}\) \{([\s\S]*?)\}/);
if (oldBadgeMatch) {
  const newBadge = `function Badge({ label, color }) {
  const c = color || SC[label?.toLowerCase()] || "#94a3b8";
  return <span style={{ background:c+"15", color:c, border:\`1px solid \${c}30\`, borderRadius:999, padding:"4px 12px", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>;
}`;
  content = content.replace(oldBadgeMatch[0], newBadge);
}

// 3. Update topbar in ApiAdminPanel
content = content.replace(
  '<div style={{ cursor:"pointer" }}><Avatar name={sessionUser?.name} size={32}/></div>',
  '<div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:"#fff", padding:"6px 16px 6px 6px", borderRadius:999, border:"1px solid #e2e8f0", boxShadow:"0 2px 6px rgba(0,0,0,0.02)" }}><Avatar name={sessionUser?.name} size={32}/><span style={{fontSize:14, fontWeight:600, color:"#0f172a"}}>{sessionUser?.name?.split(" ")[0] || "Admin"}</span><i className="ti ti-chevron-down" style={{color:"#94a3b8", fontSize:16}}/></div>'
);

// 4. Update Overview Stat cards to use better fonts
content = content.replace(
  /<div style={{fontSize:13, color:"#64748b", fontWeight:600, textTransform:"uppercase", marginBottom:8}}>{s\.lbl}<\/div>\s*<div style={{fontSize:28, fontWeight:800, color:"#0f172a"}}>{s\.val}<\/div>/g,
  '<div style={{fontSize:12, color:"#64748b", fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:10, fontFamily:"\'Inter\',sans-serif"}}>{s.lbl}</div>\n            <div style={{fontSize:32, fontWeight:800, color:"#0f172a", fontFamily:"\'Outfit\',sans-serif", letterSpacing:"-0.5px"}}>{s.val}</div>'
);

fs.writeFileSync(targetFile, content);
console.log("Upgraded ApiAdminPanel UI!");
