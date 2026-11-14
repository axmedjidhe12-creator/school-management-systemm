-- ==============================================================================
-- SOFTWARE ARCHITECTURE & BUILD SPECIFICATION
-- Multi-Tenant School Management System
-- Relational Database Schema (MySQL 5.7+ / 8.0+ / MariaDB)
-- Compatible with: XAMPP / phpMyAdmin (Local) & Railway MySQL (Production)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `email_logs`;
DROP TABLE IF EXISTS `fees`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `exams_performance`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `schools`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. SCHOOLS TABLE (Tenant Root)
-- Defines and isolates each educational institution on the platform.
-- ------------------------------------------------------------------------------
CREATE TABLE `schools` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `logo_url` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_schools_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. USERS TABLE
-- Authentication credentials, tenant identification, and role definitions.
-- Roles: 'super_admin' (School Admin), 'teacher' (Faculty), 'student' (Learner)
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'teacher', 'student') NOT NULL,
  `avatar_url` LONGTEXT DEFAULT NULL,
  `subject` VARCHAR(150) DEFAULT NULL,
  `assigned_classes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY `uq_users_school_email` (`school_id`, `email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. CLASSES TABLE
-- Grade levels / sections linked to a school and assigned to a form teacher.
-- ------------------------------------------------------------------------------
CREATE TABLE `classes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `class_name` VARCHAR(100) NOT NULL,
  `teacher_id` INT UNSIGNED DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_classes_school_id` (`school_id`),
  INDEX `idx_classes_teacher_id` (`teacher_id`),
  INDEX `idx_classes_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- Operational student profile connecting authentication user, tenant, and class.
-- ------------------------------------------------------------------------------
CREATE TABLE `students` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `class_id` INT UNSIGNED NOT NULL,
  `admission_no` VARCHAR(50) NOT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_students_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY `uq_students_school_admission` (`school_id`, `admission_no`),
  UNIQUE KEY `uq_students_user` (`user_id`),
  INDEX `idx_students_class_id` (`class_id`),
  INDEX `idx_students_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. EXAMS_PERFORMANCE TABLE
-- Stores academic examination points, grades, terms, and teacher remarks.
-- ------------------------------------------------------------------------------
CREATE TABLE `exams_performance` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `subject` VARCHAR(100) NOT NULL,
  `points` DECIMAL(5, 2) NOT NULL,
  `term` VARCHAR(50) NOT NULL,
  `remarks` TEXT DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_exams_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_exams_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_exams_school_student` (`school_id`, `student_id`),
  INDEX `idx_exams_term` (`term`),
  INDEX `idx_exams_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE TABLE
-- Daily attendance roll call logging (present, absent, late).
-- Absence logs trigger automated notifications.
-- ------------------------------------------------------------------------------
CREATE TABLE `attendance` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_attendance_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY `uq_attendance_student_date` (`school_id`, `student_id`, `date`),
  INDEX `idx_attendance_date` (`date`),
  INDEX `idx_attendance_status` (`status`),
  INDEX `idx_attendance_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. FEES TABLE
-- Manages tuition billing, payment progress, inspection, and receipts.
-- Status: 'paid', 'partial', 'unpaid'
-- ------------------------------------------------------------------------------
CREATE TABLE `fees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `amount_due` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('paid', 'partial', 'unpaid') NOT NULL DEFAULT 'unpaid',
  `due_date` DATE NOT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_fees_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fees_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_fees_school_student` (`school_id`, `student_id`),
  INDEX `idx_fees_status` (`status`),
  INDEX `idx_fees_due_date` (`due_date`),
  INDEX `idx_fees_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. EMAIL_LOGS TABLE
-- Complete audit trail for outbound SendGrid email alerts.
-- Events: 'exam_published', 'daily_absence', 'fee_notice', 'payment_receipt'
-- ------------------------------------------------------------------------------
CREATE TABLE `email_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` INT UNSIGNED NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `status` ENUM('sent', 'failed', 'queued') NOT NULL DEFAULT 'sent',
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_email_logs_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_email_logs_school` (`school_id`),
  INDEX `idx_email_logs_event` (`event_type`),
  INDEX `idx_email_logs_status` (`status`),
  INDEX `idx_email_logs_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- SAMPLE SEED DATA (Demonstrates Multi-Tenant Isolation & Role Profiles)
-- Note: Password for all demo accounts is: Password123!
-- Bcrypt Hash: $2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu
-- ==============================================================================

-- 1. Insert 2 Independent Schools (Tenants)
INSERT INTO `schools` (`id`, `school_name`, `address`, `phone`) VALUES
(1, 'Greenwood International Academy', '100 Academic Way, Metro City', '+1-555-0100'),
(2, 'St. Patrick High School', '45 Highland Road, Crestview', '+1-555-0200');

-- 2. Insert Users (Admin, Teachers, Students across both schools)
INSERT INTO `users` (`id`, `school_id`, `full_name`, `email`, `password_hash`, `role`) VALUES
-- School 1: Greenwood
(1, 1, 'Eleanor Vance (Principal)', 'admin@greenwood.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'super_admin'),
(2, 1, 'Sarah Jenkins (Math Dept)', 'sarah.jenkins@greenwood.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'teacher'),
(3, 1, 'David Miller (Science Dept)', 'david.miller@greenwood.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'teacher'),
(4, 1, 'John Doe (Student)', 'john.doe@student.greenwood.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'student'),
(5, 1, 'Jane Smith (Student)', 'jane.smith@student.greenwood.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'student'),

-- School 2: St. Patrick
(6, 2, 'Father Robert Clark', 'admin@stpatricks.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'super_admin'),
(7, 2, 'Emily Watson', 'emily.watson@stpatricks.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'teacher'),
(8, 2, 'Michael Brown (Student)', 'michael.b@student.stpatricks.edu', '$2a$10$EwJWytbMoirjD5TO48W3KO82.qEfRP8s8YlDhhtcpsodK3JJB0PTu', 'student');

-- 3. Insert Classes
INSERT INTO `classes` (`id`, `school_id`, `class_name`, `teacher_id`) VALUES
(1, 1, 'Grade 10-A (Science & Math)', 2),
(2, 1, 'Grade 11-B (Advanced Humanities)', 3),
(3, 2, 'Grade 9-Alpha', 7);

-- 4. Insert Student Profiles
INSERT INTO `students` (`id`, `school_id`, `user_id`, `class_id`, `admission_no`) VALUES
(1, 1, 4, 1, 'GW-2026-001'),
(2, 1, 5, 1, 'GW-2026-002'),
(3, 2, 8, 3, 'STP-2026-101');

-- 5. Insert Exam Performance Records
INSERT INTO `exams_performance` (`school_id`, `student_id`, `subject`, `points`, `term`, `remarks`) VALUES
(1, 1, 'Mathematics', 88.50, 'Term 1 - 2026', 'Strong problem solving skills, excellent calculus work.'),
(1, 1, 'Physics', 91.00, 'Term 1 - 2026', 'Outstanding lab performance and theoretical analysis.'),
(1, 2, 'Mathematics', 74.00, 'Term 1 - 2026', 'Good effort, needs extra practice in trigonometry.'),
(2, 3, 'English Literature', 82.00, 'Term 1 - 2026', 'Insightful essay contributions and creative reading analysis.');

-- 6. Insert Attendance Records
INSERT INTO `attendance` (`school_id`, `student_id`, `date`, `status`) VALUES
(1, 1, '2026-11-10', 'present'),
(1, 1, '2026-11-11', 'present'),
(1, 1, '2026-11-12', 'absent'),
(1, 2, '2026-11-10', 'present'),
(1, 2, '2026-11-11', 'late'),
(1, 2, '2026-11-12', 'present'),
(2, 3, '2026-11-12', 'present');

-- 7. Insert Fees Records
INSERT INTO `fees` (`school_id`, `student_id`, `amount_due`, `amount_paid`, `status`, `due_date`) VALUES
(1, 1, 1500.00, 1500.00, 'paid', '2026-12-01'),
(1, 2, 1500.00, 750.00, 'partial', '2026-12-01'),
(2, 3, 1200.00, 0.00, 'unpaid', '2026-11-30');

-- 8. Insert Email Logs
INSERT INTO `email_logs` (`school_id`, `recipient_email`, `subject`, `event_type`, `status`) VALUES
(1, 'john.doe@student.greenwood.edu', 'Absence Notice: 2026-11-12', 'daily_absence', 'sent'),
(1, 'jane.smith@student.greenwood.edu', 'Tuition Payment Receipt - Partial ($750.00)', 'payment_receipt', 'sent'),
(2, 'michael.b@student.stpatricks.edu', 'Welcome to St. Patrick High School Portal', 'exam_published', 'sent');
