<?php
// Include config file
define('ALLOW_ACCESS', true);
require_once __DIR__ . '/config.php';

// Security headers are already set in config.php

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);
$message = trim($input['message'] ?? '');
$history = $input['history'] ?? [];

if (empty($message)) {
    jsonResponse(['error' => 'Message is required'], 400);
}

try {
    // Build conversation context
    $contextPrompt = "Bạn là một AI Assistant thông minh và thân thiện của Hello World Team.";
    $contextPrompt .= "Hello World Team là một website cho phép tạo quiz dựa trên AI. ";
    $contextPrompt .= "Bạn có khả năng tạo và quản lý các bài quiz, giải đáp thắc mắc về các chủ đề, chỉ nói về Hello World Team và các sản phẩm của nó. ";
     $contextPrompt .= "Hãy dựa vào ngôn ngữ mà người dùng nhập để trả lời lại cho đúng ngôn ngữ đó.";
    $contextPrompt .= "Hãy trả lời một cách chuyên nghiệp, ngắn gọn, trả lời nhanh nhất có thể, thân thiện và hữu ích.\n\n";
    
    // Add conversation history
    if (!empty($history)) {
        $contextPrompt .= "Đây là lịch sử cuộc trò chuyện gần đây:\n";
        foreach ($history as $msg) {
            $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
            $contextPrompt .= "$role: " . $msg['content'] . "\n";
        }
        $contextPrompt .= "\nDựa vào context trên, hãy trả lời tin nhắn mới của user:\n";
    }
    
    $contextPrompt .= "User: $message\nAssistant: ";

    // Cấu hình request
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    $requestData = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $contextPrompt]
                ]
            ]
        ],
        'safetySettings' => [
            [
                'category' => 'HARM_CATEGORY_HARASSMENT',
                'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
            ],
            [
                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
            ]
        ]
    ];

    // Thực hiện request
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $apiUrl . "?key=" . GEMINI_API_KEY,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . GEMINI_API_KEY
        ],
        CURLOPT_SSL_VERIFYPEER => !IS_DEVELOPMENT
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    curl_close($curl);

    if ($err) {
        throw new Exception("cURL Error: " . $err);
    }

    if ($httpCode !== 200) {
        $errorData = json_decode($response, true);
        throw new Exception("API Error: " . ($errorData['error']['message'] ?? 'Unknown error'));
    }

    // Parse response
    $responseData = json_decode($response, true);
    
    if (!isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
        throw new Exception("Invalid response format from API");
    }

    $reply = $responseData['candidates'][0]['content']['parts'][0]['text'];
    
    // Log successful request
    error_log("[" . date('Y-m-d H:i:s') . "] Successful chat request: " . substr($message, 0, 100));
    
    jsonResponse([
        'success' => true,
        'message' => $reply
    ]);

} catch (Exception $e) {
    // Log error
    error_log("[" . date('Y-m-d H:i:s') . "] Chat API Error: " . $e->getMessage());
    
    jsonResponse([
        'error' => 'Failed to get response from AI',
        'details' => $e->getMessage()
    ], 500);
}
