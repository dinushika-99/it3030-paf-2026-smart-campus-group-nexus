# Team Database Setup (Spring Boot Auto Table Method)

Use this exact workflow to share database structure with group members.

## 1) Keep Hibernate auto-update enabled

In `backend/src/main/resources/application.properties`:

```properties
spring.jpa.hibernate.ddl-auto=update
```

## 2) Teammate creates only the empty database

Run in MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS smartcampus;
```

Or execute:

- `backend/database/create_database.sql`

## 3) Teammate configures local `.env`

Copy `backend/.env.example` to `.env` and set local values:

```properties
DB_URL=jdbc:mysql://localhost:3306/smartcampus?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your-db-password
```

## 4) Start backend

From `backend/`:

```powershell
.\mvnw.cmd spring-boot:run
```

## Result

Spring Boot + Hibernate will automatically create/update tables (`users`, `notifications`, etc.) from your entity classes.

## Note

This shares schema automatically, not existing row data.
