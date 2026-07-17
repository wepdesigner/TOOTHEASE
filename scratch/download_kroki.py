import urllib.request
import zlib
import base64

puml_code = """@startuml
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
@enduml"""

# Compress and base64 encode for Kroki
compressed = zlib.compress(puml_code.encode('utf-8'), 9)
b64 = base64.urlsafe_b64encode(compressed).decode('utf-8')

url = f"https://kroki.io/plantuml/jpeg/{b64}"
output_path = r"c:\Users\Dell\Desktop\TOOTHEASE\ClassDiagram.jpeg"

print(f"Downloading from: {url}")
urllib.request.urlretrieve(url, output_path)
print(f"Saved to {output_path}")
