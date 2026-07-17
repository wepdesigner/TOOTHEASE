const fs = require('fs');
const https = require('https');

const pumlCode = `@startuml
skinparam classAttributeIconSize 0
skinparam monochrome true
skinparam linetype ortho

class User {
  + _id: ObjectId
  + name: String
  + email: String
  + role: String
  + status: String
  + title: String
  + dob: Date
  + address: String
  + bloodType: String
  + matchPassword(): Boolean
}

class Doctor {
  + _id: ObjectId
  + specialty: String
  + consultFee: Number
  + experience: String
  + location: String
  + rating: Number
  + revenue: Number
  + status: String
}

class Appointment {
  + _id: ObjectId
  + healthType: String
  + date: Date
  + time: String
  + amount: Number
  + status: String
  + isHomeVisit: Boolean
  + isVideoConsultation: Boolean
}

class Consultation {
  + _id: ObjectId
  + type: String
  + date: Date
  + time: String
  + status: String
}

class MedicalRecord {
  + _id: ObjectId
  + title: String
  + type: String
  + symptoms: String
  + treatmentPlan: String
}

class DentalRecord {
  + _id: ObjectId
  + toothId: String
  + condition: String
  + notes: String
}

class Payment {
  + _id: ObjectId
  + service: String
  + amount: Number
  + method: String
  + status: String
}

class Prescription {
  + _id: ObjectId
  + diagnosis: String
  + medicines: Array
  + notes: String
}

class PostOpLog {
  + _id: ObjectId
  + procedureName: String
  + dayNumber: Number
  + painLevel: Number
  + sosTriggered: Boolean
}

class HomeVisit {
  + _id: ObjectId
  + address: String
  + date: Date
  + time: String
  + status: String
}

class Message {
  + _id: ObjectId
  + text: String
  + isRead: Boolean
}

class Notification {
  + _id: ObjectId
  + type: String
  + title: String
  + body: String
  + isRead: Boolean
}

class Plan {
  + _id: ObjectId
  + name: String
  + price: Number
}

User "1" -- "0..1" Doctor : profile
User "1" -- "*" Appointment : books
Doctor "1" -- "*" Appointment : receives
User "1" -- "*" Consultation : joins
Doctor "1" -- "*" Consultation : conducts
User "1" -- "*" MedicalRecord : owns
Doctor "1" -- "*" MedicalRecord : writes
User "1" -- "*" DentalRecord : owns
Doctor "1" -- "*" DentalRecord : updates
Appointment "1" -- "0..1" Payment : requires
User "1" -- "*" Payment : pays
Doctor "1" -- "*" Prescription : prescribes
User "1" -- "*" Prescription : receives
User "1" -- "*" HomeVisit : requests
Doctor "1" -- "*" HomeVisit : fulfills
User "1" -- "*" PostOpLog : logs
User "1" -- "*" Message : sends/receives
User "*" -- "0..1" Plan : subscribes
@enduml`;

const data = JSON.stringify({
  diagram_source: pumlCode,
  diagram_type: 'plantuml',
  output_format: 'jpeg'
});

const options = {
  hostname: 'kroki.io',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed with Status Code: ' + res.statusCode);
    return;
  }
  const file = fs.createWriteStream('c:/Users/Dell/Desktop/TOOTHEASE/ClassDiagram.jpeg');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('ClassDiagram.jpeg saved successfully to the TOOTHEASE directory!');
  });
});

req.on('error', (e) => {
  console.error('Problem with request: ' + e.message);
});

req.write(data);
req.end();
