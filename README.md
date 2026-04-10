# it3030-paf-2026-smart-campus-group-nexus
Smart Campus Operations Hub - A full-stack web application for managing campus services using Spring Boot, React, and MySQL.

## Team Database Sharing Method

Use this exact workflow for team development:

1. Keep `spring.jpa.hibernate.ddl-auto=update` in backend config.
2. Each teammate runs:
	- `CREATE DATABASE IF NOT EXISTS smartcampus;`
3. Each teammate sets local DB credentials in `backend/.env`.
4. Run backend and let Hibernate auto-create/update tables.

Detailed guide:

- `backend/TEAM_DATABASE_SETUP.md`
