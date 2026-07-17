const fs = require('fs');
const path = require('path');

const ucPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ucCode = fs.readFileSync(ucPath, 'utf8');

// Strip out ALL "const Model = require('../models/Model');" lines
const requireRegex = /^[ \t]*const[ \t]+[A-Za-z]+[ \t]*=[ \t]*require\(['"]\.\.\/models\/[A-Za-z]+['"]\);/gm;
ucCode = ucCode.replace(requireRegex, '');

// Strip out the previous imports I injected that might still be there, and bcrypt
const otherRequires = /^[ \t]*const[ \t]+bcrypt[ \t]*=[ \t]*require\(['"]bcryptjs['"]\);/gm;
ucCode = ucCode.replace(otherRequires, '');

// Prepend the clean block
const imports = `// src/controllers/user.controller.js
const User         = require("../models/User");
const Notification = require("../models/Notification");
const Consultation = require("../models/Consultation");
const Appointment  = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Payment      = require("../models/Payment");
const DentalRecord = require("../models/DentalRecord");
const HomeVisit    = require("../models/HomeVisit");
const MedicalRecord= require("../models/MedicalRecord");
const bcrypt       = require("bcryptjs");

`;

ucCode = imports + ucCode.replace(/^\/\/ src\/controllers\/user\.controller\.js\r?\n/g, '');

fs.writeFileSync(ucPath, ucCode);
console.log("Successfully cleaned up user.controller.js imports!");
