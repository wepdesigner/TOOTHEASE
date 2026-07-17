const fs = require('fs');
const path = require('path');

const userModelPath = path.join(__dirname, '../backend/models/User.js');
let userCode = fs.readFileSync(userModelPath, 'utf8');

if (!userCode.includes('membershipPlan:')) {
  const replacement = `membershipPlan: {
    type: String,
    enum: ['Basic', 'Silver', 'Gold'],
    default: 'Basic'
  },
  membershipExpiry: {
    type: Date,
    default: null
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'none'],
    default: 'none'
  },`;
  
  // Replace the old boolean membership field if it exists, otherwise just insert it
  if (userCode.includes('membership: {\\n    type: Boolean')) {
    userCode = userCode.replace(/membership:\s*{\s*type:\s*Boolean,\s*default:\s*false\s*},/, replacement);
  } else {
    // If not found, insert after password
    userCode = userCode.replace(
      'role: {\\n    type: String,\\n    enum: [\\'patient\\', \\'doctor\\', \\'admin\\'],\\n    default: \\'patient\\'\\n  },',
      "role: {\\n    type: String,\\n    enum: ['patient', 'doctor', 'admin'],\\n    default: 'patient'\\n  },\\n  " + replacement
    );
  }
  
  fs.writeFileSync(userModelPath, userCode);
  console.log("Updated User.js model successfully.");
} else {
  console.log("User.js already updated.");
}
