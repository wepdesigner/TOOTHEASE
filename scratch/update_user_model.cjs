const fs = require('fs');
const path = require('path');

const userModelPath = path.join(__dirname, '../backend/models/User.js');
let userCode = fs.readFileSync(userModelPath, 'utf8');

if (!userCode.includes('smilePoints:')) {
  const replacement = `membership: {
    type: Boolean,
    default: false
  },
  smilePoints: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastHygieneLog: {
    type: Date,
    default: null
  },`;
  userCode = userCode.replace(/membership:\s*{\s*type:\s*Boolean,\s*default:\s*false\s*},/, replacement);
  fs.writeFileSync(userModelPath, userCode);
  console.log("Updated User.js model successfully.");
} else {
  console.log("User.js already updated.");
}
