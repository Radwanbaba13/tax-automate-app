-- =====================================================
-- Database Setup for Tax Automate App
-- =====================================================
-- Run this SQL in phpMyAdmin on your Hostinger database
-- Database: u560342399_SankariDB

-- =====================================================
-- 1. EMAIL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `template_name` VARCHAR(255) NOT NULL,
  `subject_en` TEXT NOT NULL,
  `subject_fr` TEXT NOT NULL,
  `content_en` TEXT NOT NULL,
  `content_fr` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_name` (`template_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample templates
INSERT INTO `email_templates` (`template_name`, `subject_en`, `subject_fr`, `content_en`, `content_fr`) VALUES
('welcome', 'Welcome to Our Service', 'Bienvenue à notre service', 'Dear Customer,\n\nThank you for choosing our service.\n\nBest regards,\nThe Team', 'Cher client,\n\nMerci d''avoir choisi notre service.\n\nCordialement,\nL''équipe'),
('followup', 'Follow-up on Your Request', 'Suivi de votre demande', 'Dear Customer,\n\nWe are following up on your recent request.\n\nBest regards,\nThe Team', 'Cher client,\n\nNous faisons le suivi de votre demande récente.\n\nCordialement,\nL''équipe');

-- =====================================================
-- 2. OTHER REQUIRED TABLES (if not already created)
-- =====================================================

-- Configurations table
CREATE TABLE IF NOT EXISTS `configurations` (
  `id` VARCHAR(10) NOT NULL DEFAULT '1',
  `fed_auth_section` TEXT,
  `qc_auth_section` TEXT,
  `summary_section` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT IGNORE INTO `configurations` (`id`, `fed_auth_section`, `qc_auth_section`, `summary_section`) VALUES
('1', '[]', '[]', '[]');

-- Tax rates table
CREATE TABLE IF NOT EXISTS `tax_rates` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `province` VARCHAR(50) NOT NULL,
  `fedRate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `provRate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `province` (`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample tax rates
INSERT IGNORE INTO `tax_rates` (`province`, `fedRate`, `provRate`) VALUES
('QC', 5.00, 9.975),
('ON', 5.00, 8.00),
('BC', 5.00, 7.00),
('AB', 5.00, 0.00);

-- Price list table
CREATE TABLE IF NOT EXISTS `price_list` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `service` JSON NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'number',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample prices
INSERT IGNORE INTO `price_list` (`service`, `amount`, `type`) VALUES
('{"en": "Tax Preparation", "fr": "Préparation fiscale"}', 100.00, 'number'),
('{"en": "Consultation", "fr": "Consultation"}', 50.00, 'number');

-- Invoice number table
CREATE TABLE IF NOT EXISTS `invoice_number` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `invoices` INT(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default invoice number
INSERT IGNORE INTO `invoice_number` (`invoices`) VALUES (1);

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (change password after first login!)
INSERT IGNORE INTO `users` (`username`, `password`) VALUES
('admin', '12oo12RR$$');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify tables were created:

-- SELECT * FROM email_templates;
-- SELECT * FROM configurations;
-- SELECT * FROM tax_rates;
-- SELECT * FROM price_list;
-- SELECT * FROM invoice_number;
-- SELECT * FROM users;
