require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust path if needed

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for script");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const createOrUpdateAdmin = async () => {
  await connectDB();
  try {
    const email = "admin@gmail.com";
    const password = "admin123";

    let admin = await User.findOne({ email });

    if (admin) {
      admin.password = password;
      admin.role = "ADMIN";
      await admin.save();
      console.log("Admin user updated successfully");
    } else {
      admin = new User({
        name: "Super Admin",
        email: email,
        password: password,
        role: "ADMIN",
      });
      await admin.save();
      console.log("Admin user created successfully");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error creating/updating admin:", err);
    process.exit(1);
  }
};

createOrUpdateAdmin();
