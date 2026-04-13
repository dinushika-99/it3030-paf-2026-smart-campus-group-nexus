

CREATE DATABASE IF NOT EXISTS smart_campus_db;
USE smart_campus_db;

DROP TABLE IF EXISTS ticket_assignments;
DROP TABLE IF EXISTS ticket_status_history;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS ticket_attachments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS users;


-- ==========================================
-- 1. USERS (Roles merged into single table)
-- ==========================================
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    auth_provider ENUM('GOOGLE', 'LOCAL') NOT NULL DEFAULT 'LOCAL',
    avatar_url VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(191),
    provider_id VARCHAR(255) UNIQUE,
    role ENUM('ADMIN', 'LECTURER', 'MANAGER', 'STUDENT', 'TECHNICIAN') NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(255) UNIQUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
);

-- ==========================================
-- 2. RESOURCES (id changed to VARCHAR)
-- ==========================================
CREATE TABLE resources (
    resources_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    capacity INT NOT NULL,
    status ENUM('ACTIVE','OUT_OF_SERVICE') NOT NULL DEFAULT 'ACTIVE',
    daily_open_time TIME NOT NULL DEFAULT '08:00:00',
    daily_close_time TIME NOT NULL DEFAULT '18:00:00',
    description TEXT,
    image_url VARCHAR(500),
    is_bookable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    building VARCHAR(100),
    floor INT,
    room_number VARCHAR(50),
    area_name VARCHAR(150),
    max_booking_duration_hours INT NOT NULL DEFAULT 4,
    max_quantity INT NOT NULL DEFAULT 1,
    
    
    CONSTRAINT chk_max_duration CHECK (max_booking_duration_hours > 0),
    
     INDEX idx_resource_building (building), 
    INDEX idx_resource_type_status (type, status)

    
);


-- ==========================================
-- 3. BOOKINGS CORE (Module B)
-- ==========================================
CREATE TABLE bookings (
    booking_id VARCHAR(255) PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,    
    
    -- Foreign Keys (✅ FIXED: Types match parent tables)
    user_id VARCHAR(255) NOT NULL,                 
    resources_id BIGINT NOT NULL,                
    
    -- Time Management
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    
    -- Booking Details
    purpose VARCHAR(255) NOT NULL,
    expected_attendees INT DEFAULT 1,
    quantity_requested INT NOT NULL DEFAULT 1,     
    
    -- Workflow Status (Assignment Requirement)
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    
    -- Audit & Ownership
    created_by_user_id VARCHAR(255) NOT NULL,
    approved_by_user_id VARCHAR(255),
    cancelled_by_user_id VARCHAR(255),
    
    -- Timestamps
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    approved_at DATETIME(6),
    cancelled_at DATETIME(6),
    
    -- Constraints
    CONSTRAINT chk_booking_time CHECK (end_time > start_time),
    CONSTRAINT chk_quantity CHECK (quantity_requested >= 1),
    CONSTRAINT chk_attendees CHECK (expected_attendees >= 1),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resources_id) REFERENCES resources(resources_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Indexes for Performance & Conflict Detection
    INDEX idx_booking_user (user_id, status),
    INDEX idx_booking_resource_time (resources_id, start_time, end_time, status), -- ✅ Critical for Overlap Check
    INDEX idx_booking_status (status),
    INDEX idx_booking_code (booking_code)     
);

-- ==========================================
-- 3.1 BOOKING STATUS HISTORY (Audit Trail)
-- ==========================================
CREATE TABLE booking_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(255) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id VARCHAR(255) NOT NULL,
    change_note TEXT,                             -- Stores rejection reason or approval note
    changed_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_history_booking (booking_id, changed_at)
);


-- ==========================================
-- 4. TICKETS CORE
-- ==========================================
CREATE TABLE tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
    preferred_contact_name VARCHAR(255),
    preferred_contact_email VARCHAR(255),
    preferred_contact_phone VARCHAR(50),
    resources_id BIGINT,
    location_id VARCHAR(255),
    created_by_user_id VARCHAR(255) NOT NULL,
    assigned_technician_id VARCHAR(255),
    rejection_reason TEXT,
    resolution_notes TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    assigned_at DATETIME(6),
    resolved_at DATETIME(6),
    closed_at DATETIME(6),
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resources_id) REFERENCES resources(resources_id) ON DELETE SET NULL,
    INDEX idx_ticket_status (status),
    INDEX idx_ticket_priority (priority)
);

-- ==========================================
-- 5. TICKET ATTACHMENTS
-- ==========================================
CREATE TABLE ticket_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    caption VARCHAR(255),
    uploaded_by_user_id VARCHAR(255) NOT NULL,
    uploaded_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ==========================================
-- 6. TICKET COMMENTS (Threaded support)
-- ==========================================
CREATE TABLE ticket_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id INT,
    is_internal BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6),
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES ticket_comments(comment_id) ON DELETE SET NULL
);

-- ==========================================
-- 7. TICKET STATUS HISTORY (Audit Trail)
-- ==========================================
CREATE TABLE ticket_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id VARCHAR(255) NOT NULL,
    change_note TEXT,
    changed_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_history_ticket (ticket_id, changed_at)
);

-- ==========================================
-- 8. TICKET ASSIGNMENTS (Workload Tracking)
-- ==========================================
CREATE TABLE ticket_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    technician_id VARCHAR(255) NOT NULL,
    assigned_by_user_id VARCHAR(255) NOT NULL,
    assigned_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    unassigned_at DATETIME(6),
    assignment_note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_assignment_active (ticket_id, is_active)
);

-- ==========================================
-- 9. NOTIFICATIONS
-- ==========================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(255) NOT NULL,
    read_flag BIT(1) DEFAULT 0,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    related_entity_type VARCHAR(50),
    related_entity_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notification_user_read (user_id, read_flag),
    INDEX idx_notification_created (created_at)
);




