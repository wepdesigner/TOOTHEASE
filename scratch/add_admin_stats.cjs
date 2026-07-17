const fs = require('fs');
const path = require('path');

// 1. Update backend/controllers/admin.controller.js
const adminCtrlPath = path.join(__dirname, '../backend/controllers/admin.controller.js');
let ctrlCode = fs.readFileSync(adminCtrlPath, 'utf8');

if (!ctrlCode.includes('exports.getMembershipStats')) {
  ctrlCode += `

// --- SAAS MRR & MEMBERSHIP STATS ---
exports.getMembershipStats = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['PATIENT', 'patient'] } }).select('-password');
    
    let totalSubscribers = 0;
    let totalMRR = 0;
    let counts = { Basic: 0, 'Silver Care': 0, 'Gold Premium': 0 };
    
    // Calculate MRR
    const prices = { 'Basic': 0, 'Silver Care': 5000, 'Gold Premium': 12000 };
    
    const recentUpgrades = [];
    
    users.forEach(u => {
      const plan = u.membershipPlan || 'Basic';
      counts[plan] = (counts[plan] || 0) + 1;
      
      if (plan !== 'Basic') {
        totalSubscribers++;
        totalMRR += prices[plan] || 0;
        
        // Collect active subscribers for recent list
        recentUpgrades.push({
          id: u._id,
          name: u.name,
          email: u.email,
          plan: plan,
          expiry: u.membershipExpiry,
          updatedAt: u.updatedAt
        });
      }
    });
    
    // Sort recent upgrades by updatedAt desc
    recentUpgrades.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      stats: {
        totalSubscribers,
        totalMRR,
        counts
      },
      recent: recentUpgrades.slice(0, 50)
    });
  } catch (err) {
    console.error("getMembershipStats Error:", err);
    res.status(500).json({ success: false, message: "Unable to fetch membership stats" });
  }
};
`;
  fs.writeFileSync(adminCtrlPath, ctrlCode);
  console.log("Added getMembershipStats to admin.controller.js");
}

// 2. Update backend/routes/admin.routes.js
const adminRoutesPath = path.join(__dirname, '../backend/routes/admin.routes.js');
let routesCode = fs.readFileSync(adminRoutesPath, 'utf8');

if (!routesCode.includes('getMembershipStats')) {
  routesCode = routesCode.replace(
    'module.exports = router;',
    `// Memberships MRR
router.get("/memberships/stats", protect, authorize("ADMIN"), adminController.getMembershipStats);

module.exports = router;`
  );
  fs.writeFileSync(adminRoutesPath, routesCode);
  console.log("Added /memberships/stats route to admin.routes.js");
}
