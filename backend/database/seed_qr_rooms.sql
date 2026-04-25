-- Seed script: 10 sample rooms for QR-based ticket creation
-- Uses existing tables only: resources + tickets flow
-- Safe to run multiple times because of ON DUPLICATE KEY UPDATE on unique resource name

USE smart_campus_db;

INSERT INTO resources (
    name,
    type,
    category,
    capacity,
    status,
    daily_open_time,
    daily_close_time,
    description,
    image_url,
    is_bookable,
    building,
    floor,
    room_number,
    area_name,
    max_booking_duration_hours,
    max_quantity
) VALUES
    ('Lab 201 - Computer Systems', 'COMPUTER_LAB', 'ACADEMIC', 40, 'ACTIVE', '08:00:00', '18:00:00', 'Computer systems lab for practical sessions', NULL, TRUE, 'LAB', 2, '201', NULL, 4, 1),
    ('Lab 202 - Networks', 'LABORATORY', 'ACADEMIC', 35, 'ACTIVE', '08:00:00', '18:00:00', 'Networking lab', NULL, TRUE, 'LAB', 2, '202', NULL, 4, 1),
    ('Lab 203 - Electronics', 'LABORATORY', 'ACADEMIC', 30, 'ACTIVE', '08:00:00', '18:00:00', 'Electronics and embedded lab', NULL, TRUE, 'LAB', 2, '203', NULL, 4, 1),
    ('Lecture Hall A101', 'LECTURE_HALL', 'ACADEMIC', 120, 'ACTIVE', '08:00:00', '20:00:00', 'Main lecture hall A101', NULL, TRUE, 'A', 1, '101', NULL, 4, 1),
    ('Lecture Hall A102', 'LECTURE_HALL', 'ACADEMIC', 100, 'ACTIVE', '08:00:00', '20:00:00', 'Lecture hall A102', NULL, TRUE, 'A', 1, '102', NULL, 4, 1),
    ('Lecture Hall B201', 'LECTURE_HALL', 'ACADEMIC', 90, 'ACTIVE', '08:00:00', '20:00:00', 'Lecture hall B201', NULL, TRUE, 'B', 2, '201', NULL, 4, 1),
    ('Library Discussion Room L305', 'STUDY_ROOM', 'COMMON', 12, 'ACTIVE', '08:00:00', '19:00:00', 'Quiet group discussion room', NULL, TRUE, 'L', 3, '305', NULL, 4, 1),
    ('Admin Office C110', 'MEETING_ROOM', 'ADMINISTRATIVE', 8, 'ACTIVE', '08:00:00', '17:00:00', 'Administrative service office', NULL, TRUE, 'C', 1, '110', NULL, 4, 1),
    ('Seminar Room D404', 'STUDY_ROOM', 'ACADEMIC', 25, 'ACTIVE', '08:00:00', '18:00:00', 'Seminar room D404', NULL, TRUE, 'D', 4, '404', NULL, 4, 1),
    ('Innovation Studio E210', 'DESIGN_STUDIO', 'ACADEMIC', 20, 'ACTIVE', '08:00:00', '18:00:00', 'Innovation and prototyping studio', NULL, TRUE, 'E', 2, '210', NULL, 4, 1)
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    category = VALUES(category),
    capacity = VALUES(capacity),
    status = VALUES(status),
    daily_open_time = VALUES(daily_open_time),
    daily_close_time = VALUES(daily_close_time),
    description = VALUES(description),
    is_bookable = VALUES(is_bookable),
    building = VALUES(building),
    floor = VALUES(floor),
    room_number = VALUES(room_number),
    area_name = VALUES(area_name),
    max_booking_duration_hours = VALUES(max_booking_duration_hours),
    max_quantity = VALUES(max_quantity);

-- Ready-to-print QR values
-- Replace https://your-domain.com with your deployed frontend host.
SELECT
    resources_id,
    name,
    building,
    floor,
    room_number,
    CONCAT(UPPER(TRIM(COALESCE(building, ''))), '-', UPPER(TRIM(COALESCE(room_number, '')))) AS room_id,
    CONCAT('https://localhost:3000/tickets?roomId=',
           CONCAT(UPPER(TRIM(COALESCE(building, ''))), '-', UPPER(TRIM(COALESCE(room_number, ''))))) AS qr_url
FROM resources
WHERE building IS NOT NULL
  AND room_number IS NOT NULL
  AND TRIM(building) <> ''
  AND TRIM(room_number) <> ''
  AND status = 'ACTIVE'
ORDER BY building, floor, room_number;
