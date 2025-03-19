<?php
// Prevent direct access
if (!defined('ALLOW_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit('Direct access forbidden.');
}

// Environment detection
define('IS_DEVELOPMENT', 
    in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']) || 
    strpos($_SERVER['SERVER_NAME'], '.test') !== false
);

// Error reporting
if (IS_DEVELOPMENT) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// API Configuration
if (!defined('GEMINI_API_KEY')) {
    // In production, use environment variable
    if (getenv('GEMINI_API_KEY')) {
        define('GEMINI_API_KEY', getenv('GEMINI_API_KEY'));
    } 
    // Fallback for development (NOT RECOMMENDED FOR PRODUCTION)
    else {
        define('GEMINI_API_KEY', 'AIzaSyCI6p7OZDMa5alWGtZNd2924jc_eUJBlgI');
    }
}

// Enable CORS for all origins
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
if (!IS_DEVELOPMENT) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Response helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Error handler
function handleError($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    $errorType = match($errno) {
        E_ERROR => 'Error',
        E_WARNING => 'Warning',
        E_PARSE => 'Parse Error',
        E_NOTICE => 'Notice',
        default => 'Unknown Error'
    };
    
    $message = IS_DEVELOPMENT ? 
        "$errorType: $errstr in $errfile on line $errline" :
        'An internal error occurred';
    
    error_log("$errorType: $errstr in $errfile on line $errline");
    
    jsonResponse(['error' => $message], 500);
    return true;
}

set_error_handler('handleError');

// Allow access from other files
define('ALLOW_ACCESS', true);

// Composer autoload
require_once __DIR__ . '/../vendor/autoload.php'; 