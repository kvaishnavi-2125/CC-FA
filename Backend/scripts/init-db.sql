-- Plant Management Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS plant_management;
USE plant_management;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_image_url VARCHAR(1000),
    phone_number VARCHAR(20),
    bio TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plants Table
CREATE TABLE IF NOT EXISTS plants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255),
    common_name VARCHAR(255),
    description LONGTEXT,
    image_url VARCHAR(1000),
    location VARCHAR(255),
    acquisition_date DATE,
    watering_frequency INT COMMENT 'Days between watering',
    last_watered DATE,
    sunlight_requirement VARCHAR(100),
    temperature_range VARCHAR(100) COMMENT 'e.g., 15-25°C',
    humidity_level VARCHAR(100) COMMENT 'e.g., 50-70%',
    soil_type VARCHAR(100),
    fertilizer_type VARCHAR(100),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plant Care Logs Table
CREATE TABLE IF NOT EXISTS care_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    care_type ENUM('watering', 'fertilizing', 'pruning', 'repotting', 'pest_control', 'disease_treatment', 'other') NOT NULL,
    date DATE NOT NULL,
    notes LONGTEXT,
    care_duration_mins INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_date (date),
    INDEX idx_care_type (care_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, plant_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT,
    notification_type ENUM('watering_reminder', 'fertilizing_reminder', 'care_completed', 'milestone', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message LONGTEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plant Categories Table
CREATE TABLE IF NOT EXISTS plant_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Growth Records Table (Tracking plant growth over time)
CREATE TABLE IF NOT EXISTS growth_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    height_cm FLOAT,
    width_cm FLOAT,
    number_of_leaves INT,
    number_of_flowers INT,
    health_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    notes TEXT,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE,
    INDEX idx_plant_id (plant_id),
    INDEX idx_recorded_date (recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better query performance
CREATE INDEX idx_plants_user_id ON plants(user_id, created_at DESC);
CREATE INDEX idx_care_logs_plant_date ON care_logs(plant_id, date DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Sample Data (Optional)
INSERT INTO users (email, password_hash, full_name) VALUES 
('demo@plants.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'Demo User');
