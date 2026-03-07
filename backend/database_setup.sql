USE delulu_billing;
SHOW DATABASES;
USE delulu_billing;
SHOW TABLES;
SHOW TABLES;
DESCRIBE users;
SELECT * FROM users;
SELECT * FROM users;
SELECT * FROM users;
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    barcode VARCHAR(100) UNIQUE,
    price DECIMAL(10,2),
    stock INT,
    gst_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE,
    user_id INT,
    customer_name VARCHAR(255),
    total_amount DECIMAL(10,2),
    gst_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
USE delulu_billing;
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE,
    user_id INT,
    customer_name VARCHAR(255),
    total_amount DECIMAL(10,2),
    gst_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
SHOW TABLES;
DESCRIBE invoices;
DESCRIBE invoice_items;
SELECT * FROM invoices;
SELECT * FROM products;
SELECT * FROM products;
SELECT * FROM products;
SELECT id, name, stock FROM products;
SELECT * FROM invoices;
SELECT * FROM invoice_items;
SELECT id, name, stock FROM products;
SELECT * FROM invoices ORDER BY id DESC;
SELECT * FROM invoice_items ORDER BY id DESC;
SELECT id, name, stock FROM products;
SELECT * FROM invoices ORDER BY id DESC LIMIT 1;
ALTER TABLE products
ADD COLUMN hsn_code VARCHAR(20),
ADD COLUMN cgst_percentage DECIMAL(5,2),
ADD COLUMN sgst_percentage DECIMAL(5,2);
DESCRIBE products;
UPDATE products 
SET 
hsn_code = '0401',
cgst_percentage = 2.5,
sgst_percentage = 2.5
WHERE id = 1;
UPDATE products 
SET 
hsn_code = '0407',
cgst_percentage = 2.5,
sgst_percentage = 2.5
WHERE id = 7;
UPDATE products 
SET 
hsn_code = '1905',
cgst_percentage = 2.5,
sgst_percentage = 2.5
WHERE id = 6;
SELECT id, name, hsn_code, cgst_percentage, sgst_percentage FROM products;
SELECT id, name, hsn_code, cgst_percentage, sgst_percentage FROM products;
SELECT id, name FROM products;
UPDATE products 
SET 
hsn_code = '1701',
cgst_percentage = 2.5,
sgst_percentage = 2.5
WHERE id = 8;
SELECT id, name, hsn_code, cgst_percentage, sgst_percentage 
FROM products;
ALTER TABLE invoices
ADD COLUMN cgst_amount DECIMAL(10,2),
ADD COLUMN sgst_amount DECIMAL(10,2);
DESCRIBE invoices;
ALTER TABLE invoice_items
ADD COLUMN cgst_amount DECIMAL(10,2),
ADD COLUMN sgst_amount DECIMAL(10,2),
ADD COLUMN hsn_code VARCHAR(20);
SELECT invoice_number FROM invoices ORDER BY id DESC;
SELECT * FROM invoices;
SELECT username, password FROM users;
DELETE FROM users;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE invoices;
TRUNCATE TABLE invoice_items;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
INSERT INTO users (name, username, password, role) VALUES
('Deeban', 'admin1', 'admin123', 'admin'),
('Turnesh', 'admin2', 'admin123', 'admin'),
('Gowtham', 'staff1', 'staff123', 'staff'),
('Nishanth', 'staff2', 'staff123', 'staff');
SELECT id, name, username FROM users;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM users;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM users;
SELECT * FROM users;
DELETE FROM users WHERE id > 0;
DELETE FROM invoice_items WHERE id > 0;
DELETE FROM invoices WHERE id > 0;
DELETE FROM users WHERE id > 0;
SELECT * FROM users;
DELETE FROM invoice_items WHERE id > 0;
DELETE FROM invoices WHERE id > 0;
DELETE FROM users WHERE id > 0;
SELECT * FROM users;
INSERT INTO users (name, username, password, role) VALUES
('Deeban', 'admin1', 'admin123', 'admin'),
('Turnesh', 'admin2', 'admin123', 'admin'),
('Gowtham', 'staff1', 'staff123', 'staff'),
('Nishanth', 'staff2', 'staff123', 'staff');
SELECT SUM(net_amount) FROM invoices;
SELECT * FROM invoice_items;
SELECT * FROM invoices;
SELECT * FROM products;
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE products ADD COLUMN barcode VARCHAR(100) UNIQUE;
DESCRIBE products;
SHOW INDEX FROM products;
UPDATE products SET barcode = '8901234567001' WHERE id = 1;
UPDATE products SET barcode = '8901234567002' WHERE id = 2;
SELECT id, name, price, stock, barcode FROM products;
USE delulu_billing;
SELECT * FROM invoices;
ALTER TABLE invoices 
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
DESCRIBE invoices;
SELECT invoice_number, payment_method FROM invoices;
CREATE TABLE invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    payment_method VARCHAR(50),
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
DESCRIBE invoice_payments;
USE delulu_billing;
USE delulu_billing;

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
        ON DELETE CASCADE
);
DESCRIBE products;
USE delulu_billing;
SELECT id, username, role FROM users;
UPDATE users
SET username = 'Deeban'
WHERE username = 'admin1';
SELECT id, username, role FROM users;
UPDATE users
SET username = 'Turnesh'
WHERE username = 'admin2';
UPDATE users
SET username = 'Gowtham'
WHERE username = 'staff1';
UPDATE users
SET username = 'Nishanth'
WHERE username = 'staff2';
USE delulu_billing;
DESCRIBE products;