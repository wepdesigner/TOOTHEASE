const fs = require('fs');
const path = require('path');

const ctrlPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrlCode.includes('exports.logHygieneActivity')) {
  // Add HygieneLog requirement at the top if not exists
  if (!ctrlCode.includes("const HygieneLog = require('../models/HygieneLog');")) {
    ctrlCode = ctrlCode.replace(
      "const PostOpLog = require('../models/PostOpLog');", 
      "const PostOpLog = require('../models/PostOpLog');\nconst HygieneLog = require('../models/HygieneLog');"
    );
  }

  const newMethods = `
// ----------------------------------------------------
// HYGIENE TRACKER
// ----------------------------------------------------

exports.logHygieneActivity = async (req, res) => {
  try {
    const { brushed, flossed, mouthwash, dateString } = req.body;
    const patientId = req.user.id;
    const today = dateString || new Date().toISOString().split('T')[0];

    // Find or create today's log
    let log = await HygieneLog.findOne({ patientId, dateString: today });
    if (!log) {
      log = new HygieneLog({ patientId, dateString: today });
    }

    // Check if points were already awarded for today
    const alreadyLoggedToday = log.brushed || log.flossed || log.mouthwash;

    // Update log
    log.brushed = log.brushed || brushed;
    log.flossed = log.flossed || flossed;
    log.mouthwash = log.mouthwash || mouthwash;
    await log.save();

    // Give points (only if they haven't been awarded today)
    // For example: +10 points for each activity per day
    let pointsEarned = 0;
    if (brushed && !alreadyLoggedToday) pointsEarned += 10;
    if (flossed && !alreadyLoggedToday) pointsEarned += 10;
    if (mouthwash && !alreadyLoggedToday) pointsEarned += 5;

    // Update user streak and points
    const user = await User.findById(patientId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check if yesterday was logged to maintain streak
    if (!alreadyLoggedToday) {
      user.smilePoints = (user.smilePoints || 0) + pointsEarned;
      
      const yesterday = new Date(new Date(today).setDate(new Date(today).getDate() - 1)).toISOString().split('T')[0];
      const yesterdayLog = await HygieneLog.findOne({ patientId, dateString: yesterday });
      
      if (yesterdayLog && (yesterdayLog.brushed || yesterdayLog.flossed || yesterdayLog.mouthwash)) {
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else {
        user.currentStreak = 1; // reset streak if yesterday was missed
      }
      user.lastHygieneLog = new Date();
      await user.save();
    }

    res.status(200).json({ 
      success: true, 
      log, 
      streak: user.currentStreak, 
      points: user.smilePoints,
      pointsEarned
    });
  } catch (error) {
    console.error('Hygiene Log Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHygieneStats = async (req, res) => {
  try {
    const patientId = req.user.id;
    const user = await User.findById(patientId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get this month's logs
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const logs = await HygieneLog.find({ 
      patientId, 
      createdAt: { $gte: startOfMonth }
    }).sort({ dateString: 1 });

    res.status(200).json({
      success: true,
      streak: user.currentStreak || 0,
      points: user.smilePoints || 0,
      logs
    });
  } catch (error) {
    console.error('Get Hygiene Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
`;

  ctrlCode += newMethods;
  fs.writeFileSync(ctrlPath, ctrlCode);
  console.log("Updated user.controller.js with hygiene methods.");
} else {
  console.log("user.controller.js already updated.");
}
