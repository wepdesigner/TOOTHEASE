const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../backend/.env' });

const Consultation = require('../backend/models/Consultation');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const consultations = await Consultation.find().lean();
      console.log(`Found ${consultations.length} consultations.`);
      for (const c of consultations) {
        console.log(`Consultation ${c._id}: doctorId=${c.doctorId}, patientId=${c.patientId}`);
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
