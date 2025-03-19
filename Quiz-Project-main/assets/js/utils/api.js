const QuizAPI = {
    generateQuiz: async function (quizData) {
        try {
            console.log('Gửi yêu cầu API với dữ liệu:', quizData);
            const response = await fetch('https://ttphuc.com/api/quiz/generator.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quizData)
            });

            console.log('API Request Status:', response.status);
            console.log('API Request OK:', response.ok);

            if (!response.ok) {
                throw new Error(`Failed to generate quiz. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response Data:', data);
            return data;
        } catch (error) {
            console.error('Error in QuizAPI:', error);
            throw error;
        }
    }
};
// Thêm dòng này để export QuizAPI ra global scope
window.QuizAPI = QuizAPI;