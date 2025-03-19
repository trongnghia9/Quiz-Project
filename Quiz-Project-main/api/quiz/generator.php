<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Kiểm tra method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Lấy dữ liệu từ request
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['title']) || !isset($data['language']) || !isset($data['questionCount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

// API key được lưu trên server
$API_KEY = 'AIzaSyCI6p7OZDMa5alWGtZNd2924jc_eUJBlgI';
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Tạo prompt cho Gemini
$prompt = [
    'contents' => [[
        'parts' => [[
            'text' => "Generate a quiz with both single choice and multiple choice questions.
            Return only JSON with the following structure:
            {
                \"quiz_title\": \"{$data['title']}\",
                \"language\": \"{$data['language']}\",
                \"number_of_questions\": {$data['questionCount']},
                \"questions\": [
                    {
                        \"question\": \"Question text\",
                        \"type\": \"abcd\",
                        \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"],
                        \"correct_answer\": \"Correct Option\",
                        \"reason\": \"Explanation\"
                    },
                    {
                        \"question\": \"Multi-choice question\",
                        \"type\": \"multi_choice\",
                        \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"],
                        \"correct_answers\": [\"Option 1\", \"Option 3\"],
                        \"reason\": \"Explanation\"
                    }
                ]
            }"
        ]]
    ]]
];

// Gọi API Gemini
$ch = curl_init($url . "?key=" . $API_KEY);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($prompt)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Kiểm tra response
if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate quiz']);
    exit;
}

// Xử lý và trả về kết quả
$result = json_decode($response, true);
if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid API response']);
    exit;
}

$quizData = $result['candidates'][0]['content']['parts'][0]['text'];
// Làm sạch và parse JSON từ response
$quizData = preg_replace('/```json\n|```/', '', $quizData);
$quiz = json_decode($quizData, true);

if (!$quiz || !isset($quiz['questions'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse quiz data']);
    exit;
}

echo json_encode($quiz); 