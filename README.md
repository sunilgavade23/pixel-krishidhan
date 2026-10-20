📍 GeoMark
Smart QR-Based Attendance System with GPS Geofencing
Overview
GeoMark is a web-based attendance management system that uses QR-code check-ins and GPS geofencing to help teachers record and monitor student attendance. Teachers create attendance sessions for a class, and students scan the session QR code while within the configured location radius.

The application supports teacher and student accounts, live session monitoring, attendance management, and CSV reports.
Problem
Manual attendance can consume class time and make records difficult to organize. QR codes alone can also be shared with students who are not physically present in the classroom.

GeoMark combines QR-based check-in with a distance check against the classroom coordinates to make attendance recording more convenient and location-aware.
Solution
Teachers create an attendance session with the subject, class, division, classroom coordinates, and an allowed radius. Students log in, scan the session QR code, and submit their location. GeoMark calculates the distance between the student's coordinates and the session location, then records attendance only if the session is active and the student is within the configured radius.
How It Works
Teacher Flow
1. Register or log in as a teacher.
2. Create an attendance session and select the subject and class.
3. Set the classroom location and geofence radius.
4. Display the session QR code to students.
5. Monitor attendance and manage recorded statuses.
6. Close the session and export attendance as a CSV file.
Student Flow
1. Register or log in as a student.
2. Open the student dashboard and scan the session QR code.
3. Allow browser location access when prompted.
4. Submit the check-in for geofence validation.
5. View personal attendance information from the student dashboard.
Core Features
- Role-based accounts: Separate teacher and student experiences.
- QR-based attendance: Students check in using a session-specific QR code.
- GPS geofencing: Validates the distance between the student's location and the classroom.
- Configurable radius: Teachers set the permitted radius for each session.
- Live session monitoring: Teachers can view attendance updates during an active session.
- Attendance management: Teachers can review records and update statuses to Present, Absent, or Late, with notes.
- Student dashboard: Students can review their attendance information.
- CSV export: Export a session's attendance roster and details.
- Dual database support: SQLite for local development and Firebase Cloud Firestore for production deployment.
📍 Location Validation
GeoMark uses the browser Geolocation API to obtain the student's latitude and longitude. It then uses the Haversine formula to calculate the distance between the student's reported coordinates and the classroom coordinates.

Attendance is accepted only when:
- The QR/session token is valid.
- The attendance session is still active.
- The student's calculated distance is within the session's configured radius.
The radius is configurable by the teacher, from greater than 0 up to 5,000 metres. Geolocation depends on browser permission and device accuracy, so it should not be treated as cryptographic proof of physical presence.
Technical Architecture
Frontend
- HTML
- CSS
- JavaScript
- Jinja templates
- QR scanning interface
- Leaflet.js for the teacher's map interface
Backend
- Python
- Flask
Data Storage
- SQLite for local development
- Firebase Cloud Firestore for production
Supporting Libraries and Services
- qrcode and Pillow for QR-code generation
- Firebase Admin SDK for Firestore integration
- Browser Geolocation API for location capture
- Vercel for deployment
System Flow
Teacher / Student
        |
        v
   Flask Web App
        |
        +----------------------+
        |                      |
        v                      v
 Teacher Session          Student QR Check-in
        |                      |
        v                      v
 QR Code + Location       Get Browser Location
        |                      |
        +----------+-----------+
                   |
                   v
        Haversine Distance Check
                   |
                   v
       Active Session + Radius Check
                   |
                   v
          Attendance Record
                   |
          +--------+--------+
          |                 |
          v                 v
   Teacher Dashboard    Student Dashboard
          |
          v
       CSV Export
Technology Stack
Component	Technology
Language	Python
Web framework	Flask
Frontend	HTML, CSS, JavaScript, Jinja
QR generation	qrcode, Pillow
Database (local)	SQLite
Database (production)	Firebase Cloud Firestore
Maps	Leaflet.js
Deployment	Vercel


Project Structure
GeoMark-attendance/
├── app.py                 # Flask routes and application logic
├── database.py            # Database access and SQLite/Firebase routing
├── firebase_db.py         # Firebase Cloud Firestore operations
├── utils.py               # Shared utilities and distance calculation
├── seed_demo_data.py      # Creates local demonstration data
├── seed_firebase.py       # Seeds demonstration data in Firebase
├── requirements.txt       # Python dependencies
├── vercel.json            # Vercel deployment configuration
├── test_app.py            # Application tests
├── templates/             # Jinja HTML templates
└── static/
    ├── css/               # Application styles
    └── js/                # QR scanner and map scripts
Getting Started
Requirements
- Python 3.10 or newer
- pip
1. Clone the Repository
git clone https://github.com/sunilgavade23/GeoMark-attendance.git
cd GeoMark-attendance
2. Create a Virtual Environment
Windows
python -m venv .venv
.venv\Scripts\activate
macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
3. Install Dependencies
pip install -r requirements.txt
4. Run the Application
python app.py
Open http://localhost:5000 in your browser.

For local development, GeoMark uses SQLite when Firebase is not configured.
Optional: Load Demonstration Data
python seed_demo_data.py
Run this script only if you want sample users and records in your local database.
Firebase and Vercel Deployment
GeoMark requires Firebase Cloud Firestore for production deployment on Vercel. SQLite is disabled in production because serverless instances do not provide reliable persistent local storage.
1. Create a Firebase project and enable Cloud Firestore.
2. Create a Firebase service account and obtain its JSON credentials.
3. In the Vercel project settings, configure these environment variables:
Variable	Purpose
FIREBASE_SERVICE_ACCOUNT_KEY	Firebase service-account JSON used to connect to Firestore
SECRET_KEY	Secret key for Flask session signing


4. Deploy the project to Vercel.
5. Verify login, session creation, QR check-in, location validation, attendance updates, and CSV export on the deployed site.
Keep service-account credentials and production secrets private. Never commit them to Git.
Running Tests
Run the included test suite with:
python -m unittest test_app.py
Security and Usage Notes
- Browser geolocation generally requires HTTPS in deployed environments; localhost is treated as a secure context by modern browsers.
- Students must grant location permission for location-based check-in.
- GPS accuracy varies by device and environment.
- Configure Firebase credentials and Firestore access appropriately before using real student records.
- Change the default development secret by setting SECRET_KEY in the environment.
- Do not commit secrets or real student data to the repository.
Author
Sunil Gavade
