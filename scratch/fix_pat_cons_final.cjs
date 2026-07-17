const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let ppCode = fs.readFileSync(ppPath, 'utf8');

// Use regex to insert handleUpdate at the top of PatConsultations and modify handleDelete
const patConsRegex = /function PatConsultations\(\{ consultations, onJoinCall, refresh, showToast \}\) \{[\s\r\n]*const handleDelete = async \(id\) => \{[\s\r\n]*if \(\!window\.confirm\("Delete this consultation\?"\)\) return;[\s\r\n]*try \{[\s\r\n]*await API\.delete\(`\/users\/me\/consultations\/\$\{id\}`\);[\s\r\n]*if \(showToast\) showToast\("Deleted successfully", "success"\);[\s\r\n]*if \(refresh\) refresh\(\);[\s\r\n]*\} catch\(e\) \{[\s\r\n]*if \(showToast\) showToast\("Failed to delete", "error"\);[\s\r\n]*\}[\s\r\n]*\};/m;

const newPatConsTop = `function PatConsultations({ consultations, onJoinCall, refresh, showToast }) {
  const handleUpdate = async (item, status) => {
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? \`/users/me/appointments/\${item._id||item.id}/status\` : \`/users/me/consultations/\${item._id||item.id}/status\`;
      const finalStatus = isAppt ? (status === "accepted" ? "CONFIRMED" : "CANCELLED") : status;
      await API.patch(url, { status: finalStatus });
      if (showToast) showToast(status === "accepted" ? "Accepted" : "Declined", "success");
      if (refresh) refresh();
    } catch(e) { if (showToast) showToast("Failed to update", "error"); }
  };
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this consultation?")) return;
    try {
      const isAppt = item.healthType !== undefined;
      const url = isAppt ? \`/users/me/appointments/\${item._id||item.id}\` : \`/users/me/consultations/\${item._id||item.id}\`;
      await API.delete(url);
      if (showToast) showToast("Deleted successfully", "success");
      if (refresh) refresh();
    } catch(e) {
      if (showToast) showToast("Failed to delete", "error");
    }
  };`;

ppCode = ppCode.replace(patConsRegex, newPatConsTop);

fs.writeFileSync(ppPath, ppCode);
console.log("Successfully injected handleUpdate and robust handleDelete to PatConsultations");
