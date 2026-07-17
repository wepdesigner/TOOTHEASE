require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const User = require("./models/User");

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for fix script");

    const email = "admin@gmail.com";
    let admin = await User.findOne({ email });

    if (admin) {
      // Just set the plain password, the pre('save') hook will hash it ONCE
      admin.password = "admin123";
      await admin.save();
      console.log("Admin password fixed successfully");
    } else {
      console.log("Admin not found");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixAdmin();
