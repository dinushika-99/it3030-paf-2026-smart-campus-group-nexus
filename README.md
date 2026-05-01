# 🎓 Smart Campus – Nexus

A full-stack campus management system developed for SLIIT IT3030 (PAF) module.
This platform helps students, staff, and administrators manage bookings, support tickets, and campus resources efficiently.

---

## 🚀 Features

* 🔐 Authentication (JWT + OAuth2)
* 📅 Booking Management System
* 🎫 Ticketing System
* 📊 Analytics Dashboard
* 🏫 Resource & Facility Management
* 🔔 Notifications System
* 👨‍🔧 Technician Workspace
* ⚙️ Admin Dashboard

---

## 🛠 Tech Stack

### Backend

* Spring Boot
* Java
* MySQL
* JPA / Hibernate
* JWT Authentication

### Frontend

* React
* Tailwind CSS
* Axios
* Chart.js

---

## 📁 Project Structure

```
smart-campus-nexus/
│
├── backend/        # Spring Boot API
├── frontend/       # React App
├── database/       # SQL scripts
├── uploads/        # File storage
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd smart-campus-nexus
```

### 2️⃣ Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🗄️ Database Setup

```sql
CREATE DATABASE smartcampus;
```

Update your backend `.env` file:

```
DB_URL=jdbc:mysql://localhost:3306/smartcampus
DB_USERNAME=root
DB_PASSWORD=your_password
```

---

## 🌐 Application URLs

* Frontend: http://localhost:3000
* Backend: http://localhost:8080/api

---

## 📡 API Overview

| Method | Endpoint             | Description    |
| ------ | -------------------- | -------------- |
| POST   | /auth/register       | Register user  |
| POST   | /auth/login          | Login          |
| GET    | /bookings            | Get bookings   |
| POST   | /tickets             | Create ticket  |
| GET    | /analytics/dashboard | View analytics |

---

## 👥 Team

**Group Nexus – SLIIT PAF 2026**

* Member 1
* Member 2
* Member 3
* Member 4

---

## 🐛 Common Issues

* **Port already in use** → Change port in config
* **Database error** → Check MySQL is running
* **CORS issue** → Ensure backend is running

---

## 📌 Notes

* Each developer should use their own local database
* Hibernate auto-creates tables
* Use Git properly (pull before push)

---

## 📄 License

This project is developed for academic purposes (SLIIT – IT3030 PAF).

---

⭐ *Simple, scalable, and smart campus solution*
