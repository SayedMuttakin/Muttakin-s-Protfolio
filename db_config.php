<?php
/**
 * Database Configuration
 * Portfolio Contact Form Backend
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'alkhair1_protfolio');
define('DB_USER', 'alkhair1_protfolio');
define('DB_PASS', 'protfolio123');

// Email settings
define('ADMIN_EMAIL', 'kawsaruidesigner@gmail.com');
define('SITE_NAME', 'Kawsar Ahmed Portfolio');

// SMTP Settings (For reliable delivery)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587); // 465 for SSL, 587 for TLS
define('SMTP_USER', 'info@kawsarahmed.bd'); // Your professional cPanel email
define('SMTP_PASS', 'protfolio123'); // Your email password

/**
 * Get PDO database connection
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
}

/**
 * Create the contact_submissions table if it doesn't exist
 */
function createTableIfNotExists($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS contact_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) DEFAULT NULL,
        interested_in VARCHAR(255) DEFAULT NULL,
        budget VARCHAR(50) DEFAULT NULL,
        project_details TEXT DEFAULT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
}
