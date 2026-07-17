const fs = require('fs');
const path = require('path');

const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

const simulateAiScan = `
const simulateAiScan = async (req, res) => {
  try {
    // Simulate AI processing delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scenarios for the AI to return
    const scenarios = [
      {
        diagnosis: "Mild Tartar Buildup & Gingivitis",
        confidence: 94,
        severity: "Low",
        recommendation: "Routine Cleaning",
        details: "Detected plaque accumulation along the gumline of the lower incisors."
      },
      {
        diagnosis: "Potential Cavity (Caries)",
        confidence: 87,
        severity: "Medium",
        recommendation: "Consultation",
        details: "Dark spot detected on the occlusal surface, likely requiring a filling."
      },
      {
        diagnosis: "Healthy Teeth & Gums",
        confidence: 98,
        severity: "None",
        recommendation: "None",
        details: "No visible signs of decay or inflammation. Keep up the good work!"
      },
      {
        diagnosis: "Severe Gum Inflammation",
        confidence: 91,
        severity: "High",
        recommendation: "Consultation",
        details: "Significant redness and swelling detected. Immediate periodontal evaluation recommended."
      }
    ];

    // Pick a random scenario
    const result = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    res.status(200).json({ success: true, aiResult: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "AI Engine error" });
  }
};
`;

if (!ucCode.includes('simulateAiScan')) {
  ucCode = ucCode.replace('getMyDentalRecords,', 'getMyDentalRecords,\n  simulateAiScan,');
  ucCode = ucCode.replace('const getMyDentalRecords = async', simulateAiScan + '\nconst getMyDentalRecords = async');
  fs.writeFileSync(ucPath, ucCode);
}

const urPath = path.join(__dirname, '../backend/routes/user.routes.js');
let urCode = fs.readFileSync(urPath, 'utf8');
if (!urCode.includes('simulateAiScan')) {
  urCode = urCode.replace('getMyDentalRecords, ', 'getMyDentalRecords, simulateAiScan, ');
  urCode = urCode.replace('module.exports = router;', 'router.post("/me/ai-scan", protect, simulateAiScan);\n\nmodule.exports = router;');
  fs.writeFileSync(urPath, urCode);
}

console.log("Backend AI Scan endpoint added.");
