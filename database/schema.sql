-- ============================================================
-- AI-Powered Smart Pharmacy Availability Checker
-- Database Schema (PostgreSQL / Neon Serverless)
-- ============================================================

-- Create ENUM types if not exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'pharmacy', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('low_stock', 'reservation', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ---------------------------------------------------------
-- USERS (customers, pharmacy owners, admins)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(15),
    role          user_role NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- PHARMACIES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacies (
    pharmacy_id   SERIAL PRIMARY KEY,
    owner_id      INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    address       VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    latitude      DECIMAL(10,7),
    longitude     DECIMAL(10,7),
    phone         VARCHAR(15),
    is_verified   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- MEDICINES (master catalogue)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id   SERIAL PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS pharmacy_medicines (
    stock_id      SERIAL PRIMARY KEY,
    pharmacy_id   INT NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    medicine_id   INT NOT NULL REFERENCES medicines(medicine_id) ON DELETE CASCADE,
    price         DECIMAL(10,2) NOT NULL,
    quantity      INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_stock UNIQUE (pharmacy_id, medicine_id)
);

-- ---------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    pharmacy_id    INT NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    medicine_id    INT NOT NULL REFERENCES medicines(medicine_id) ON DELETE CASCADE,
    quantity       INT NOT NULL DEFAULT 1,
    status         reservation_status DEFAULT 'pending',
    reserved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_by      TIMESTAMP
);

-- ---------------------------------------------------------
-- SALES_HISTORY (used by AI/ML service for demand prediction)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_history (
    sale_id       SERIAL PRIMARY KEY,
    pharmacy_id   INT NOT NULL REFERENCES pharmacies(pharmacy_id) ON DELETE CASCADE,
    medicine_id   INT NOT NULL REFERENCES medicines(medicine_id) ON DELETE CASCADE,
    quantity_sold INT NOT NULL,
    sale_date     DATE NOT NULL
);

-- ---------------------------------------------------------
-- NOTIFICATIONS (low stock alerts, reservation updates)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message         VARCHAR(255) NOT NULL,
    type            notification_type DEFAULT 'system',
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- SEED DATA (sample) for quick demo/testing
-- ---------------------------------------------------------
INSERT INTO medicines (name, generic_name, category, manufacturer, requires_prescription) 
VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pain Relief', 'Cipla', FALSE),
('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'Sun Pharma', TRUE),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'GSK', FALSE),
('Metformin 500mg', 'Metformin', 'Diabetes', 'USV', TRUE),
('Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 'Cipla', TRUE),
('Ibuprofen 400mg', 'Ibuprofen', 'Pain Relief', 'Abbott', FALSE),
('Vitamin D3', 'Cholecalciferol', 'Supplement', 'Mankind', FALSE),
('Pantoprazole 40mg', 'Pantoprazole', 'Antacid', 'Alkem', TRUE)
ON CONFLICT DO NOTHING;
