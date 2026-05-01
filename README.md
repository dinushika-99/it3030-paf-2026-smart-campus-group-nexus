# Smart Campus - Nexus Web Application 🎓

A comprehensive full-stack web application for managing campus services and operations. The Smart Campus Operations Hub enables students, staff, and administrators to efficiently manage bookings, handle support tickets, access analytics, and collaborate across campus resources.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Team Development Workflow](#team-development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)

---

## 🎯 Project Overview

**Smart Campus - Nexus** is an integrated campus management system designed for SLIIT (Sri Lanka Institute of Information Technology) IT3030 PAF (Programming Application and Framework) module. The application streamlines campus operations by providing a centralized platform for:

- **Student Services**: Booking spaces, raising support tickets, viewing analytics
- **Technician Support**: Managing work orders, tracking issues, collaborative problem-solving
- **Admin Management**: Dashboard analytics, resource management, system configuration
- **Campus Operations**: Real-time notifications, QR code room management, resource catalog

---

## 🛠 Technology Stack

### Backend
- **Framework**: Spring Boot 4.0.5
- **Language**: Java 18
- **Database**: MySQL 8.0
- **ORM**: JPA/Hibernate
- **Authentication**: JWT + OAuth2 (Google & GitHub)
- **Mail Service**: Spring Mail
- **Validation**: Jakarta Validation API
- **Build Tool**: Maven

### Frontend
- **Library**: React 19.2.4
- **Language**: JavaScript (JSX)
- **UI Framework**: Tailwind CSS 3.x
- **Routing**: React Router DOM 7.13.2
- **HTTP Client**: Axios 1.15.2
- **Charts**: Chart.js 4.5.1 + react-chartjs-2
- **QR Code**: html5-qrcode 2.3.8
- **UI Components**: Radix UI, Lucide React
- **Notifications**: react-hot-toast, Sonner
- **Styling**: PostCSS

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm (Frontend), Maven (Backend)
- **Development Server**: React Scripts, Spring Boot DevTools

---

## ✨ Key Features

### 1. Authentication & Authorization
- User registration and login
- JWT token-based authentication
- OAuth2 integration (Google, GitHub)
- Role-based access control (RBAC)
- Password reset and forgot password functionality

### 2. Booking Management System
- Reserve campus facilities and resources
- View availability calendar
- Edit and cancel bookings
- Booking history and confirmation
- Admin booking management dashboard

### 3. Ticketing System
- Create, view, and manage support tickets
- Categorize and prioritize tickets
- Ticket status tracking (Open, In Progress, Resolved)
- Technician assignment and updates
- Ticket history and analytics

### 4. Analytics Dashboard
- Campus utilization metrics
- Booking trends and statistics
- Ticket resolution analytics
- Resource usage reports
- Visual charts and graphs

### 5. Resource Management
- Facilities catalog with QR codes
- Resource details and specifications
- Availability tracking
- Admin resource configuration
- Upload and manage facility images

### 6. Notifications System
- Real-time notifications
- Email notifications
- In-app notification center
- Notification preferences
- Activity logs

### 7. Technician Workspace
- Assigned work orders
- Issue tracking and resolution
- Collaborative notes
- Priority management
- Time tracking

### 8. Admin Dashboard
- System overview and statistics
- User management
- Resource administration
- Report generation
- System configuration

### 9. User Profiles
- Avatar upload
- Profile information management
- User preferences
- Account settings

---

## 📁 Project Structure

```
it3030-paf-2026-smart-campus-group-nexus/
│
├── backend/                          # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/backend/
│   │   │   │   ├── analytics/       # Analytics module
│   │   │   │   ├── auth/            # Authentication services
│   │   │   │   ├── booking/         # Booking management
│   │   │   │   ├── common/          # Shared utilities
│   │   │   │   ├── config/          # Configuration classes
│   │   │   │   ├── controller/      # REST API endpoints
│   │   │   │   ├── modulea/         # Additional module
│   │   │   │   ├── notifications/   # Notification services
│   │   │   │   ├── Ticketing/       # Ticket management
│   │   │   │   └── BackendApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── META-INF/
│   │   └── test/                    # Unit tests
│   ├── database/
│   │   ├── create_database.sql      # Database initialization
│   │   └── seed_qr_rooms.sql        # Sample data
│   ├── pom.xml                      # Maven dependencies
│   ├── mvnw / mvnw.cmd              # Maven wrapper
│   ├── TEAM_DATABASE_SETUP.md       # Team setup guide
│   └── .env                         # Environment variables
│
├── frontend/                        # React Application
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Layout components
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Footer.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── auth/                # Login, Register, Reset Password
│   │   │   ├── bookings/            # Booking pages
│   │   │   ├── features/            # Resources, Facilities
│   │   │   ├── technician/          # Technician workspace
│   │   │   ├── tickets/             # Ticket management
│   │   │   ├── AnalyticsDashboard.js
│   │   │   └── HomePage.js
│   │   ├── services/                # API services
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions
│   │   ├── api/                     # Axios configuration
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── AuthContext.js           # Auth state management
│   │   └── siteConfig.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── public/
│
├── uploads/                         # File storage
│   ├── avatars/                     # User avatars
│   └── tickets/                     # Ticket attachments
│
└── README.md                        # Project documentation
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Java Development Kit (JDK)**: Version 18 or higher
  - Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or use OpenJDK
  
- **Node.js**: Version 16.x or higher
  - Download from [Node.js](https://nodejs.org/)
  - Includes npm package manager
  
- **MySQL Server**: Version 8.0 or higher
  - Download from [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
  - Or use [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) for GUI management
  
- **Git**: Version 2.x or higher
  - Download from [Git](https://git-scm.com/)

### Optional
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code
- **Postman**: For API testing (https://www.postman.com/)
- **MySQL Workbench**: For database management

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
# Navigate to your desired directory
cd path/to/projects

# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd it3030-paf-2026-smart-campus-group-nexus
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies and build
.\mvnw.cmd clean install

# Or on macOS/Linux:
./mvnw clean install
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Or using yarn
yarn install
```

### Step 4: Database Setup

```bash
# Open MySQL and create the database
mysql -u root -p

# In MySQL shell:
CREATE DATABASE IF NOT EXISTS smartcampus;

# Exit MySQL
exit
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Create `.env` file** in `backend/` directory:

```properties
# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/smartcampus?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your-mysql-password

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION=86400000

# OAuth2 Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Server Port
SERVER_PORT=8080
```

2. **Update `application.properties`**:

```properties
# Server
server.port=${SERVER_PORT:8080}
server.servlet.context-path=/api

# Database
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION}
```

### Frontend Configuration

1. **Update `.env` file** in `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

2. **Configure API Base URL** in `src/api/axiosClient.js`

---

## ▶️ Running the Application

### Method 1: Terminal/Command Prompt

#### Backend - Terminal 1:
```bash
cd backend
.\mvnw.cmd spring-boot:run

# Or on macOS/Linux:
./mvnw spring-boot:run
```

Backend will be available at: **http://localhost:8080/api**

#### Frontend - Terminal 2:
```bash
cd frontend
npm start

# Or using yarn:
yarn start
```

Frontend will be available at: **http://localhost:3000**

### Method 2: IDE

#### IntelliJ IDEA (Backend):
1. Open `backend` folder as project
2. Right-click on `BackendApplication.java`
3. Select "Run 'BackendApplication'"

#### VS Code (Frontend):
1. Open `frontend` folder
2. Open integrated terminal
3. Run `npm start`

---

## 🗄️ Database Setup

### Automatic Setup (Using Hibernate)

The application uses Hibernate auto-update to manage the database schema automatically.

1. Ensure `spring.jpa.hibernate.ddl-auto=update` is set in `application.properties`
2. Run the backend application
3. Hibernate will automatically create/update all required tables

### Manual Setup (Optional)

If you prefer manual setup, run the SQL scripts:

```bash
# Create database
mysql -u root -p < backend/database/create_database.sql

# Seed sample data (optional)
mysql -u root -p smartcampus < backend/database/seed_qr_rooms.sql
```

### Database Tables

The application automatically creates these tables:
- `users` - User accounts
- `bookings` - Facility bookings
- `tickets` - Support tickets
- `notifications` - System notifications
- `resources` - Campus resources
- `rooms` - QR-coded rooms
- And other supporting tables

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/forgot-password` | Reset password request |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | Get all bookings |
| POST | `/bookings` | Create new booking |
| GET | `/bookings/{id}` | Get booking details |
| PUT | `/bookings/{id}` | Update booking |
| DELETE | `/bookings/{id}` | Cancel booking |

### Ticket Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | Get all tickets |
| POST | `/tickets` | Create new ticket |
| GET | `/tickets/{id}` | Get ticket details |
| PUT | `/tickets/{id}` | Update ticket |
| DELETE | `/tickets/{id}` | Delete ticket |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard statistics |
| GET | `/analytics/bookings` | Booking analytics |
| GET | `/analytics/tickets` | Ticket analytics |

---

## 🎨 Frontend Features

### Pages & Components

1. **Authentication**
   - Login page with email/password
   - Registration page
   - Forgot password flow
   - OAuth2 integration (Google, GitHub)
   - Protected routes

2. **Dashboard**
   - User dashboard with quick stats
   - Recent bookings
   - Pending tickets
   - Notifications

3. **Bookings**
   - Browse facilities
   - Create bookings
   - Edit bookings
   - View booking history
   - Calendar view

4. **Resources & Facilities**
   - Facilities catalog
   - Resource details
   - QR code scanning
   - Availability status
   - Image gallery

5. **Tickets**
   - Create support tickets
   - View ticket status
   - Ticket history
   - Priority levels
   - Attachments

6. **Technician Workspace**
   - Assigned work orders
   - Issue tracking
   - Collaborative notes
   - Priority management

7. **Analytics Dashboard**
   - Visual charts and graphs
   - Usage statistics
   - Trend analysis
   - Export reports

8. **Admin Dashboard**
   - System overview
   - User management
   - Resource configuration
   - Settings management

---

## 👥 Team Development Workflow

### For Team Members

1. **Initial Setup** (First time only)
   ```bash
   # Clone repository
   git clone <repository-url>
   cd it3030-paf-2026-smart-campus-group-nexus
   ```

2. **Create Local Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE IF NOT EXISTS smartcampus;
   exit
   ```

3. **Configure Backend**
   - Copy `.env.example` to `.env`
   - Update database credentials with your local MySQL password

4. **Start Development**
   ```bash
   # Terminal 1: Backend
   cd backend
   .\mvnw.cmd spring-boot:run
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

5. **Sync with Team**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Make your changes
   git add .
   git commit -m "Describe your changes"
   
   # Push to repository
   git push origin main
   ```

### Database Sharing

- Keep `spring.jpa.hibernate.ddl-auto=update` enabled
- Hibernate automatically creates/updates tables when the backend runs
- No need to share database dumps
- Each team member has their own local database
- Schema is synchronized through entity classes

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: Port 8080 already in use
```bash
# Find process using port
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in application.properties
server.port=8081
```

**Issue**: Database connection failed
- Check MySQL server is running
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

**Issue**: JWT token expired
- Token expires after configured time (default: 24 hours)
- Login again or use refresh token endpoint

### Frontend Issues

**Issue**: Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Issue**: API calls failing (CORS errors)
- Check backend is running on http://localhost:8080
- Verify `REACT_APP_API_URL` in `.env`
- Check CORS configuration in Spring Boot

**Issue**: Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Issue**: Hibernate not creating tables
- Check `spring.jpa.hibernate.ddl-auto=update` is set
- Verify entity classes have correct annotations
- Check application logs for errors

**Issue**: Connection timeout
```properties
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.maximum-pool-size=5
```

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Authentication](https://jwt.io)

---

## 📝 License

This project is created for SLIIT IT3030 PAF (Programming Application and Framework) module.

---

## 👨‍💻 Contributors

**Group Nexus** - SLIIT IT3030 PAF 2026

### Team Members:
- [Add team member names here]
- [Add team member names here]
- [Add team member names here]
- [Add team member names here]

---

## 📧 Support & Contact

For issues, questions, or contributions:
1. Create an issue in the repository
2. Contact the team leads
3. Refer to `TEAM_DATABASE_SETUP.md` for database setup issues

---

## 🎉 Getting Started Checklist

- [ ] Clone repository
- [ ] Install Java 18+
- [ ] Install Node.js 16+
- [ ] Install MySQL 8+
- [ ] Create `.env` file in backend
- [ ] Update database credentials
- [ ] Run `mvn clean install` (backend)
- [ ] Run `npm install` (frontend)
- [ ] Create MySQL database
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Access application at http://localhost:3000

---

**Last Updated**: May 2026

**Version**: 1.0.0

---
