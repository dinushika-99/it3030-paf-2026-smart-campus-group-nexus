# 🎓 Smart Campus – Nexus

A full-stack campus management system developed for SLIIT IT3030 (PAF) module.
This platform enables students, staff, and administrators to manage campus resources, bookings, and maintenance efficiently through a centralized system.

---

## 🚀 Features

* 🔐 Authentication & Authorization (JWT + OAuth2)
* 📅 Booking Management System
* 🎫 Ticketing & Incident Management
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
* Spring Security + JWT

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
git clone https://github.com/dinushika-99/it3030-paf-2026-smart-campus-group-nexus.git
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
CREATE DATABASE smart_campus_db;
```

---

## 🌐 Application URLs

* Frontend: http://localhost:3000
* Backend: http://localhost:8080/api

---

## 💡 Innovation Features

### 🔐 Advanced Authentication & Security

* Two-Factor Authentication (2FA) using authenticator apps
* JWT access + refresh tokens with secure HttpOnly cookies
* Google & GitHub OAuth2 login integration
* Automated email system for password recovery

### 🎫 Smart Ticketing & QR Assistance

* Automatic priority suggestion based on ticket description
* QR code scanning to quickly fetch resource/location details
* Faster and more accurate ticket creation

### 📊 Top Resource Utilization Overview

* Displays most frequently booked resources
* Helps administrators identify high-demand facilities
* Supports better planning and resource allocation

### 📈 Booking Analytics Insights

* Peak booking hours visualization
* Busiest day identification
* Monthly booking trends analysis
* Supports decision-making and capacity planning

---

## 🎯 Key Modules

* **Facilities & Assets Catalogue** – Manage campus resources
* **Booking Management** – Conflict-free booking workflow
* **Ticketing System** – Incident reporting with attachments
* **Notifications** – Real-time updates for users
* **Authentication** – Secure role-based access

---

## 📄 License

This project is developed for academic purposes (SLIIT – IT3030 PAF).

---

⭐ *A smart, scalable solution for modern campus operations*
