const fs = require('fs');
const path = require('path');

const ctrlPath = path.join(__dirname, '../backend/controllers/user.controller.js');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrlCode.includes('upgradeMembership')) {
  const newMethod = `
// ----------------------------------------------------
// MEMBERSHIP SUBSCRIPTION
// ----------------------------------------------------

module.exports.upgradeMembership = async (req, res) => {
  try {
    const { plan, duration, price } = req.body;
    const patientId = req.user.id;
    const user = await User.findById(patientId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mock payment successful logic
    
    // Set expiry
    const expiry = new Date();
    if (duration === 'annual') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    user.membershipPlan = plan;
    user.membershipStatus = 'active';
    user.membershipExpiry = expiry;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: \`Successfully upgraded to \${plan}\`,
      membershipPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      membershipExpiry: user.membershipExpiry
    });
  } catch (error) {
    console.error('Membership Upgrade Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upgrade' });
  }
};
`;

  ctrlCode += newMethod;
  fs.writeFileSync(ctrlPath, ctrlCode);
  console.log("Updated user.controller.js with membership upgrade.");
} else {
  console.log("user.controller.js already updated.");
}
