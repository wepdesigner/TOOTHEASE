const fs = require('fs');
const path = require('path');

const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

// The file currently has:
// const bcrypt       = require("bcryptjs");
//
//
//     // Prevent email clash

// Find index of "bcryptjs"
const bIndex = ucCode.indexOf('require("bcryptjs");');
// Find index of "// Prevent email clash"
const pIndex = ucCode.indexOf('// Prevent email clash');

if (bIndex > -1 && pIndex > -1) {
  const newMiddle = `

/* ══════════════════════════════════════════════════════════════ */
const updateMe = async (req, res) => {
  try {
    const allowed = ["name", "phone", "dob", "country", "address",
                     "bloodType", "allergies", "emergency", "email"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    `;
  ucCode = ucCode.substring(0, bIndex + 'require("bcryptjs");'.length) + newMiddle + ucCode.substring(pIndex);
  fs.writeFileSync(ucPath, ucCode);
  console.log("Successfully fixed the broken updateMe signature!");
} else {
  console.log("Could not find the indices!");
}
