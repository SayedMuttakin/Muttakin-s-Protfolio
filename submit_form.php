<?php
/**
 * Contact Form Submission Handler
 * Saves to MySQL database and sends email notification via SMTP
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

require_once 'db_config.php';
require_once 'smtp_mailer.php';

// Get and sanitize form data
$full_name = isset($_POST['full_name']) ? trim(htmlspecialchars($_POST['full_name'])) : '';
$email = isset($_POST['email']) ? trim(htmlspecialchars($_POST['email'])) : '';
$whatsapp = isset($_POST['whatsapp']) ? trim(htmlspecialchars($_POST['whatsapp'])) : '';
$interested_in = isset($_POST['interested_in']) ? trim(htmlspecialchars($_POST['interested_in'])) : '';
$budget = isset($_POST['budget']) ? trim(htmlspecialchars($_POST['budget'])) : '';
$project_details = isset($_POST['project_details']) ? trim(htmlspecialchars($_POST['project_details'])) : '';

// Validation
$errors = [];

if (empty($full_name)) {
    $errors[] = 'Full name is required.';
}

if (empty($email)) {
    $errors[] = 'Email is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

try {
    // Connect to database
    $pdo = getDBConnection();
    
    // Create table if not exists
    createTableIfNotExists($pdo);
    
    // Insert submission
    $stmt = $pdo->prepare("INSERT INTO contact_submissions 
        (full_name, email, whatsapp, interested_in, budget, project_details) 
        VALUES (:full_name, :email, :whatsapp, :interested_in, :budget, :project_details)");
    
    $stmt->execute([
        ':full_name' => $full_name,
        ':email' => $email,
        ':whatsapp' => $whatsapp,
        ':interested_in' => $interested_in,
        ':budget' => $budget,
        ':project_details' => $project_details,
    ]);
    
    // Send email notification via SMTP
    $to = ADMIN_EMAIL;
    $subject = "New Project Inquiry from " . $full_name;
    
    // HTML Email Template
    $emailBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(90deg, #7C6CFF, #9A46F5); color: #ffffff; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
            .content { padding: 30px; }
            .detail-group { margin-bottom: 20px; }
            .label { font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 6px; }
            .value { font-size: 16px; color: #1A1A4E; font-weight: 500; background: #f9fafb; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #7C6CFF; }
            .project-details { font-size: 15px; color: #4b5563; line-height: 1.6; background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap; margin-top: 10px; }
            .footer { background: #1A1A4E; color: #9ca3af; text-align: center; padding: 20px; font-size: 13px; }
            .btn { display: inline-block; padding: 10px 20px; background: #7C6CFF; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>New Project Inquiry</h1>
                <p style='margin: 10px 0 0 0; opacity: 0.9; font-size: 15px;'>You have a new message from your portfolio.</p>
            </div>
            <div class='content'>
                <div class='detail-group'>
                    <div class='label'>Full Name</div>
                    <div class='value'>{$full_name}</div>
                </div>
                <div class='detail-group'>
                    <div class='label'>Email Address</div>
                    <div class='value'><a href='mailto:{$email}' style='color:#1A1A4E; text-decoration:none; word-break: break-all;'>{$email}</a></div>
                </div>
                <div class='detail-group'>
                    <div class='label'>WhatsApp Number</div>
                    <div class='value'><a href='https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp) . "' style='color:#1A1A4E; text-decoration:none;'>{$whatsapp}</a></div>
                </div>
                <div class='detail-group'>
                    <div class='label'>Interested In</div>
                    <div class='value'>{$interested_in}</div>
                </div>
                <div class='detail-group'>
                    <div class='label'>Project Budget</div>
                    <div class='value' style='background: #f0edff; color: #7C6CFF;'>{$budget}</div>
                </div>
                <div class='detail-group' style='margin-bottom: 0;'>
                    <div class='label'>Project Details</div>
                    <div class='project-details'>" . nl2br($project_details) . "</div>
                </div>
                
                <div style='text-align: center; margin-top: 30px;'>
                    <a href='mailto:{$email}' class='btn'>Reply to {$full_name}</a>
                </div>
            </div>
            <div class='footer'>
                This email was sent from your portfolio contact form.<br>
                " . date('F j, Y, g:i a') . "
            </div>
        </div>
    </body>
    </html>
    ";
    
    $mailer = new SMTPMailer(SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS);
    $mailSent = $mailer->send($to, $subject, $emailBody, $email, $full_name);
    
    // Success response
    if ($mailSent) {
        echo json_encode([
            'success' => true, 
            'message' => 'Thank you! Your project inquiry has been submitted successfully. I will get back to you soon!'
        ]);
    } else {
        // Data is saved in DB, but SMTP failed
        echo json_encode([
            'success' => true, 
            'message' => 'Your message was saved! However, there was an issue with the SMTP email sender: ' . $mailer->getLastError() . '. Please check your config.'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Something went wrong. Please try again later.']);
}
