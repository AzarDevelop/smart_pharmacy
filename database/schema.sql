-- ============================================================
-- AI-Powered Smart Pharmacy Availability Checker
-- Database Schema (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_pharmacy;
USE smart_pharmacy;

-- ---------------------------------------------------------
-- USERS  (customers, pharmacy owners, admins)
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(15),
    role          ENUM('customer','pharmacy','admin') NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- PHARMACIES
-- ---------------------------------------------------------
CREATE TABLE pharmacies (
    pharmacy_id   INT AUTO_INCREMENT PRIMARY KEY,
    owner_id      INT NOT NULL,
    name          VARCHAR(150) NOT NULL,
    address       VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    latitude      DECIMAL(10,7),
    longitude     DECIMAL(10,7),
    phone         VARCHAR(15),
    is_verified   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- MEDICINES (master catalogue)
-- ---------------------------------------------------------
CREATE TABLE medicines (
    medicine_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    generic_name  VARCHAR(150),
    category      VARCHAR(100),
    manufacturer  VARCHAR(150),
    description   TEXT,
    requires_prescription BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- PHARMACY_MEDICINES (stock table - many-to-many)
-- ---------------------------------------------------------
CREATE TABLE pharmacy_medicines (
    stock_id      INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id   INT NOT NULL,
    medicine_id   INT NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    quantity      INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE,
    UNIQUE KEY unique_stock (pharmacy_id, medicine_id)
);

-- ---------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    pharmacy_id    INT NOT NULL,
    medicine_id    INT NOT NULL,
    quantity       INT NOT NULL DEFAULT 1,
    status         ENUM('pending','confirmed','ready','completed','cancelled') DEFAULT 'pending',
    reserved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_by      DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- SALES_HISTORY  (used by the AI/ML service for demand prediction)
-- ---------------------------------------------------------
CREATE TABLE sales_history (
    sale_id       INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id   INT NOT NULL,
    medicine_id   INT NOT NULL,
    quantity_sold INT NOT NULL,
    sale_date     DATE NOT NULL,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- NOTIFICATIONS  (low stock alerts, reservation updates)
-- ---------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    message         VARCHAR(255) NOT NULL,
    type            ENUM('low_stock','reservation','system') DEFAULT 'system',
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- SEED DATA (sample) for quick demo/testing
-- ---------------------------------------------------------
INSERT INTO medicines (name, generic_name, category, manufacturer, requires_prescription) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pain Relief', 'Cipla', FALSE),
('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'Sun Pharma', TRUE),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'GSK', FALSE),
('Metformin 500mg', 'Metformin', 'Diabetes', 'USV', TRUE),
('Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 'Cipla', TRUE),
('Ibuprofen 400mg', 'Ibuprofen', 'Pain Relief', 'Abbott', FALSE),
('Vitamin D3', 'Cholecalciferol', 'Supplement', 'Mankind', FALSE),
('Pantoprazole 40mg', 'Pantoprazole', 'Antacid', 'Alkem', TRUE);
