const fs = require('fs');
const path = require('path');

const ppPath = path.join(__dirname, '../src/Pages/Patient/PatientPanel.jsx');
let code = fs.readFileSync(ppPath, 'utf8');

const target = `  useEffect(() => {
    const t = setInterval(refresh, 5000);
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);`;

const replacement = `  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(ppPath, code);
  console.log("Fixed duplicate t (LF)!");
} else {
  // Try CRLF
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if (code.includes(targetCRLF)) {
    code = code.replace(targetCRLF, replacementCRLF);
    fs.writeFileSync(ppPath, code);
    console.log("Fixed duplicate t (CRLF)!");
  } else {
    // Try to fix it more robustly
    code = code.replace(/const t = setInterval\(refresh, 5000\);\r?\n\s*const t = setInterval\(refresh, 5000\);/g, 'const t = setInterval(refresh, 5000);');
    fs.writeFileSync(ppPath, code);
    console.log("Fixed duplicate t via regex!");
  }
}
