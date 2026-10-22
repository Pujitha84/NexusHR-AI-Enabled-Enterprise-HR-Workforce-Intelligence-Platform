 NexusHR – AI-Enabled Enterprise HR & Workforce Intelligence Platform

## Project Overview

NexusHR is a web-based Human Resource Management System designed to simplify employee management, attendance tracking, leave management, and workforce analytics through a centralized dashboard.

The application uses React and TypeScript for the frontend, Spring Boot for the backend, and PostgreSQL for database management.


## Features

1. Employee Management
   - Add, view, edit, and delete employee records.
   - Search employees by name, department, email, and job title.

2. Attendance Management
   - Track daily employee attendance.
   - Record Present, Absent, and On Leave statuses.
   - Record check-in and check-out times.

3. Leave Management
   - View employee leave requests.
   - View leave details and recorded decisions.

4. Workforce Analytics
   - Display workforce statistics and department summaries.
   - Present attendance insights based on available records.

5. Settings
   - Manage supported workspace preferences.

## Technology Stack

Frontend: React, TypeScript, Vite, HTML, CSS

Backend: Java 25 (LTS), Spring Boot, Spring Data JPA, Maven

Database: PostgreSQL 14

## Project Structure

NexusHR/
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       └── LeaveManagement.tsx
│
├── demo/
│   ├── src/
│   │   └── main/
│   │       └── resources/
│   │           └── application.properties
│   ├── pom.xml
│   └── mvnw.cmd
│
└── README.md

## Prerequisites

- Java Development Kit (JDK) 25 (LTS)
- Node.js and npm
- PostgreSQL 14
- Visual Studio Code (recommended)

## Database Configuration

NexusHR uses PostgreSQL to store employee, attendance, and leave-management data.

1. Start the PostgreSQL service.
2. Open pgAdmin and confirm that the nexushr database exists.
3. Open demo/src/main/resources/application.properties.
4. Configure the database connection using the following settings.

spring.application.name=nexushr
spring.datasource.url=jdbc:postgresql://localhost:5432/nexushr
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.open-in-view=false

Keep your database password private. Set the DB_PASSWORD environment variable before starting the backend.

## How to Run the Application

### Step 1: Start the Backend

1. Open Visual Studio Code.
2. Open a new PowerShell terminal.
3. Navigate to the backend folder using:

cd "$HOME\Downloads\NexusHR – AI-Enabled Enterprise HR & Workforce Intelligence Platform\demo"

4. Set the PostgreSQL password securely:

$secure = Read-Host "Enter your PostgreSQL password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secure).Password

5. Start Spring Boot:

.\mvnw.cmd spring-boot:run

Wait until the terminal displays a message indicating that the application has started successfully.

Backend URL: http://localhost:8080

Keep the backend terminal open while using NexusHR.

### Step 2: Start the Frontend

1. Open a second PowerShell terminal in Visual Studio Code.
2. Navigate to the frontend folder:

cd "$HOME\Downloads\NexusHR – AI-Enabled Enterprise HR & Workforce Intelligence Platform\frontend"

3. Start the Vite development server:

node .\node_modules\vite\bin\vite.js

4. Wait until the terminal displays the local URL.

Frontend URL: http://localhost:5173/

5. Open the URL in your browser.

Keep both backend and frontend terminals running while using NexusHR.

### Step 3: Build for Production

Open a terminal in the frontend folder and run:

node .\node_modules\typescript\bin\tsc -b

node .\node_modules\vite\bin\vite.js build

The production files will be generated in the frontend/dist folder.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/employees | Retrieve employee records |
| POST | /api/employees | Add an employee |
| PUT | /api/employees/{id} | Update an employee |
| DELETE | /api/employees/{id} | Delete an employee |
| GET | /api/attendance?date={date} | Retrieve attendance records |
| POST | /api/attendance | Save an attendance record |
| GET | /api/leaves | Retrieve leave requests |

Additional API endpoints may be available depending on the backend implementation.

## Testing Checklist

- Backend starts successfully.
- PostgreSQL connection works.
- Employee records load correctly.
- Employee creation, editing, and deletion work.
- Attendance records can be saved and retrieved.
- Leave requests and recorded decisions display correctly.
- Workforce Analytics displays available data.
- Settings behave as expected.
- Frontend production build completes successfully.

## Future Enhancements

- Role-based authentication and authorization.
- Employee self-service portal.
- Email notifications for leave requests.
- Advanced workforce analytics and visual reports.
- Payroll and performance management integration.
- Cloud deployment and automated testing.

## Author

Developed as a full-stack software project to demonstrate employee administration, REST API integration, database management, and workforce intelligence.

## License

This project is intended for educational and portfolio demonstration.
