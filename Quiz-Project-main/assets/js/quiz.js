document.addEventListener("DOMContentLoaded", async function () {
    console.log('Trang đã tải, bắt đầu quá trình load quiz...');

    // Đảm bảo spinner hiển thị và ở giữa màn hình
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block'; // Hiển thị spinner
    document.getElementById('quiz-container').classList.add('hidden'); // Ẩn quiz-container

    await loadQuiz(); // Chờ loadQuiz hoàn tất

    // Ẩn spinner và hiện quiz sau khi tải xong
    spinner.style.display = 'none';
    document.getElementById('quiz-container').classList.remove('hidden');
});

let questions = [];
let currentQuestionIndex = 0;
let timer;
let timeLeft;
let selectedAnswers = [];
let score = 0; // Điểm số
let correctCount = 0; // Số câu đúng
let wrongCount = 0; // Số câu sai
let totalTime = 0; // Tổng thời gian hoàn thành tất cả câu hỏi
let questionStartTime; // Thời gian bắt đầu mỗi câu hỏi

async function loadQuiz() {
    try {
        let savedData = localStorage.getItem("quizData");
        let quizData;

        if (!savedData) {
            console.log("Không có dữ liệu trong localStorage, sử dụng dữ liệu mặc định");
            quizData = defaultQuizData;
        } else {
            console.log("Dữ liệu từ localStorage:", savedData);
            quizData = JSON.parse(savedData);
            console.log("Dữ liệu sau khi parse:", quizData);

            const apiResponse = await QuizAPI.generateQuiz({
                title: quizData.topic,
                language: quizData.language,
                questionCount: quizData.numberOfQuestions
            });

            if (!apiResponse || !apiResponse.questions) {
                throw new Error("Dữ liệu từ API không hợp lệ");
            }

            quizData = apiResponse;
            console.log("Dữ liệu quiz cuối cùng từ API:", quizData);
        }

        document.getElementById("quiz-title").textContent = quizData.quiz_title;
        questions = quizData.questions;
        score = 0;
        correctCount = 0; // Reset số câu đúng
        wrongCount = 0; // Reset số câu sai
        totalTime = 0; // Reset tổng thời gian
        displayQuestion(0);

    } catch (error) {
        console.error("🚨 Lỗi khi tải quiz:", error);
        alert("Không thể tải quiz từ API. Sử dụng dữ liệu mặc định!");
        document.getElementById("quiz-title").textContent = defaultQuizData.quiz_title;
        questions = defaultQuizData.questions;
        score = 0;
        correctCount = 0;
        wrongCount = 0;
        totalTime = 0;
        displayQuestion(0);
    }
}

function displayQuestion(index) {
    clearInterval(timer);
    timeLeft = 30;
    selectedAnswers = [];
    questionStartTime = Date.now(); // Ghi lại thời gian bắt đầu câu hỏi


    const questionNumber = document.getElementById("question-number");
    const questionText = document.getElementById("question-text");
    const answersContainer = document.getElementById("answers-container");
    const timerElement = document.getElementById("timer");
    const nextButton = document.getElementById("next-question");
    const submitButton = document.getElementById("submit-multiple");
    const reasonContainer = document.getElementById("reason-container");

    const currentQuestion = questions[index];
    questionNumber.textContent = `Question ${index + 1}/${questions.length}`;
    questionText.textContent = currentQuestion.question;

    answersContainer.innerHTML = "";
    reasonContainer.classList.add("hidden");
    nextButton.classList.add("hidden");
    submitButton.classList.add("hidden"); // Ẩn nút Submit mặc định

    console.log("Hiển thị câu hỏi:", currentQuestion);

    if (currentQuestion.type === "abcd") {
        currentQuestion.options.forEach((option) => {
            const button = document.createElement("button");
            button.classList.add("answer", "w-full", "bg-gray-700", "text-white", "p-3", "rounded-lg", "hover:bg-gray-600");
            button.textContent = option;
            button.onclick = () => checkAnswer(button, option, currentQuestion.correct_answer, currentQuestion.reason);
            answersContainer.appendChild(button);
        });
    } else if (currentQuestion.type === "multi_choice") {
        submitButton.classList.remove("hidden");
        currentQuestion.options.forEach((option) => {
            const button = document.createElement("button");
            button.classList.add("answer", "w-full", "bg-gray-700", "text-white", "p-3", "rounded-lg", "hover:bg-gray-600", "flex", "items-center", "space-x-2");

            // Tạo khung checkbox với icon
            const checkboxContainer = document.createElement("span");
            checkboxContainer.classList.add("checkbox-container", "h-5", "w-5", "border", "border-gray-500", "rounded", "flex", "items-center", "justify-center");
            const checkboxIcon = document.createElement("i");
            checkboxIcon.classList.add("fas", "fa-check", "text-blue-500", "hidden"); // Icon mặc định ẩn
            checkboxContainer.appendChild(checkboxIcon);

            // Thêm khung checkbox và text vào button
            const label = document.createElement("span");
            label.textContent = option;
            button.appendChild(checkboxContainer);
            button.appendChild(label);

            // Sự kiện click cho button
            button.onclick = (e) => {
                e.preventDefault();
                const checkboxIcon = button.querySelector(".checkbox-container i"); // Lấy icon từ button
                handleMultipleChoiceSelection(button, checkboxIcon, option);
            };

            answersContainer.appendChild(button);
        });

        submitButton.onclick = () => {
            if (Array.isArray(currentQuestion.correct_answers)) {
                checkMultipleChoice(currentQuestion.correct_answers, currentQuestion.reason);
            } else {
                console.error("correct_answers is not an array for multi_choice question:", currentQuestion);
            }
        };

        submitButton.disabled = true;
        answersContainer.addEventListener('click', () => {
            if (selectedAnswers.length > 0) {
                submitButton.disabled = false;
            } else {
                submitButton.disabled = true;
            }
        });
    } else {
        console.error("Loại câu hỏi không được hỗ trợ:", currentQuestion.type);
        answersContainer.innerHTML = "<p class='text-red-500'>Loại câu hỏi này không được hỗ trợ!</p>";
    }

    timerElement.textContent = timeLeft;
    startTimer();
}

function handleMultipleChoiceSelection(button, checkboxIcon, option) {
    if (selectedAnswers.includes(option)) {
        selectedAnswers = selectedAnswers.filter(ans => ans !== option);
        button.classList.remove("bg-gray-600");
        button.classList.add("bg-gray-700", "hover:bg-gray-600");
        checkboxIcon.classList.add("hidden"); // Ẩn icon khi bỏ chọn
    } else {
        selectedAnswers.push(option);
        button.classList.remove("bg-gray-700", "hover:bg-gray-600");
        button.classList.add("bg-gray-600");
        checkboxIcon.classList.remove("hidden"); // Hiện icon khi chọn
        checkboxIcon.classList.add("text-blue-500"); // Đảm bảo màu xanh khi chọn
    }
    console.log("Selected Answers:", selectedAnswers);
}

function startTimer() {
    const timerElement = document.getElementById("timer");
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            showCorrectAnswer();
        } else {
            timerElement.textContent = --timeLeft;
        }
    }, 1000);
}

function checkAnswer(button, selectedOption, correct_answer, reason) {
    clearInterval(timer);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    totalTime += timeTaken;
    document.querySelectorAll(".answer").forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("hover:bg-gray-600");
    });
    const reasonContainer = document.getElementById("reason-container");
    const reasonText = document.getElementById("reason-text");

    if (selectedOption === correct_answer) {
        button.classList.add("bg-green-500");
        button.style.backgroundColor = "rgb(31,66,55)";
        button.style.border = "2px solid rgb(33,170,86)";
        score += 1;
        correctCount += 1;
    } else {
        button.classList.add("bg-red-500");
        button.style.backgroundColor = "#482a32";
        button.style.border = "2px solid #b03a3d";
        wrongCount += 1;
        showCorrectAnswer();
    }

    reasonText.textContent = reason;
    reasonContainer.classList.remove("hidden");
    document.getElementById("next-question").classList.remove("hidden");
}

function checkMultipleChoice(correct_answers, reason) {
    clearInterval(timer);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    totalTime += timeTaken;

    document.querySelectorAll(".answer").forEach(button => {
        button.disabled = true;
        button.classList.remove("hover:bg-gray-600");
    });

    const reasonContainer = document.getElementById("reason-container");
    const reasonText = document.getElementById("reason-text");
    const submitButton = document.getElementById("submit-multiple");

    // Kiểm tra xem có bất kỳ lựa chọn sai nào không
    let hasWrongSelection = false;

    // Kiểm tra từng lựa chọn của người dùng
    selectedAnswers.forEach(selected => {
        if (!correct_answers.includes(selected)) {
            hasWrongSelection = true;
        }
    });

    // Kiểm tra các đáp án đúng bị bỏ sót
    correct_answers.forEach(correct => {
        if (!selectedAnswers.includes(correct)) {
            hasWrongSelection = true;
        }
    });

    // Nếu không có lựa chọn sai nào, câu trả lời là đúng
    if (!hasWrongSelection) {
        score += 1;
        correctCount += 1;
    }

    document.querySelectorAll(".answer").forEach(button => {
        const option = button.querySelector("span:nth-child(2)").textContent;
        const checkboxIcon = button.querySelector(".checkbox-container i");

        if (correct_answers.includes(option)) {
            // Đánh dấu đáp án đúng
            button.classList.add("bg-green-500");
            button.style.backgroundColor = "rgb(31,66,55)";
            button.style.border = "2px solid rgb(33,170,86)";
            checkboxIcon.classList.remove("hidden");
            checkboxIcon.classList.replace("text-blue-500", "text-green-500");
            button.classList.remove("bg-gray-600", "bg-gray-700");

            // Nếu đáp án đúng bị bỏ sót
            if (!selectedAnswers.includes(option)) {
                // Thêm dấu hiệu cho biết đây là đáp án đúng bị bỏ sót
                const missedIcon = document.createElement("i");
                missedIcon.className = "fas fa-exclamation-circle text-yellow-500 ml-2";
                button.appendChild(missedIcon);
            }
        } else if (selectedAnswers.includes(option)) {
            // Đánh dấu lựa chọn sai
            button.classList.add("bg-red-500");
            button.style.backgroundColor = "#482a32";
            button.style.border = "2px solid #b03a3d";
            checkboxIcon.classList.remove("hidden");
            checkboxIcon.classList.replace("text-blue-500", "text-red-500");
            button.classList.remove("bg-gray-600", "bg-gray-700");
        } else {
            checkboxIcon.classList.add("hidden");
        }
    });

    reasonText.textContent = reason;
    reasonContainer.classList.remove("hidden");
    submitButton.classList.add("hidden");
    document.getElementById("next-question").classList.remove("hidden");
}

function showCorrectAnswer() {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    totalTime += timeTaken;

    const reasonContainer = document.getElementById("reason-container");
    const reasonText = document.getElementById("reason-text");
    const submitButton = document.getElementById("submit-multiple");

    if (currentQuestion.type === "multi_choice") {
        const isCorrect = selectedAnswers.length === currentQuestion.correct_answers.length &&
            selectedAnswers.every(ans => currentQuestion.correct_answers.includes(ans));
        if (isCorrect) {
            score += 1;
            correctCount += 1;
        }
    }

    document.querySelectorAll(".answer").forEach(button => {
        button.disabled = true;
        button.classList.remove("hover:bg-gray-600");
        const option = currentQuestion.type === "abcd" ? button.textContent : button.querySelector("span:nth-child(2)").textContent;
        const checkboxIcon = button.querySelector(".checkbox-container i");

        if (currentQuestion.type === "abcd") {
            if (option === currentQuestion.correct_answer) {
                button.classList.add("bg-green-500");
                button.style.backgroundColor = "rgb(31,66,55)";
                button.style.border = "2px solid rgb(33,170,86)";
                button.classList.remove("bg-gray-700", "bg-gray-600");
            }
        } else if (currentQuestion.type === "multi_choice" && Array.isArray(currentQuestion.correct_answers)) {
            if (currentQuestion.correct_answers.includes(option)) {
                button.classList.add("bg-green-500");
                button.style.backgroundColor = "rgb(31,66,55)";
                button.style.border = "2px solid rgb(33,170,86)";
                checkboxIcon.classList.remove("hidden");
                checkboxIcon.classList.replace("text-blue-500", "text-green-500");
                button.classList.remove("bg-gray-700", "bg-gray-600");
            } else if (selectedAnswers.includes(option)) {
                button.classList.add("bg-red-500");
                button.style.backgroundColor = "#482a32";
                button.style.border = "2px solid #b03a3d";
                checkboxIcon.classList.remove("hidden");
                checkboxIcon.classList.replace("text-blue-500", "text-red-500");
                button.classList.remove("bg-gray-700", "bg-gray-600");
            } else {
                checkboxIcon.classList.add("hidden");
            }
        }
    });

    reasonText.textContent = currentQuestion.reason;
    reasonContainer.classList.remove("hidden");
    submitButton.classList.add("hidden");
    document.getElementById("next-question").classList.remove("hidden");
}

function endQuiz() {
    const quizContainer = document.getElementById("quiz-container");
    const quizResults = document.getElementById("quiz-results");
    document.getElementById("quiz-title").textContent = "Hoàn thành!";
    document.getElementById("question-number").textContent = "";
    document.getElementById("question-text").textContent = "Bạn đã hoàn thành bài quiz!";
    document.getElementById("answers-container").innerHTML = "";
    document.getElementById("reason-container").classList.add("hidden");
    document.getElementById("submit-multiple").classList.add("hidden");
    document.getElementById("next-question").classList.add("hidden");
    quizContainer.classList.add("hidden");

    // Hiển thị kết quả với animation
    quizResults.classList.remove("hidden");
    setTimeout(() => {
        quizResults.classList.add("show");
        createConfetti();
    }, 100);

    // Hiển thị kết quả với animation số đếm
    const totalQuestions = questions.length;
    const avgTime = totalTime / totalQuestions;

    // Tính lại số câu sai dựa trên tổng số câu trừ số câu đúng
    wrongCount = totalQuestions - correctCount;

    // Cập nhật các giá trị hiển thị
    animateValue("score", 0, score, 1500);
    animateValue("total-questions", 0, totalQuestions, 1500);
    animateValue("correct-count", 0, correctCount, 1500);
    animateValue("wrong-count", 0, wrongCount, 1500);
    animateValue("total-questions-count", 0, totalQuestions, 1500);

    // Animate average time with decimals
    const avgTimeEl = document.getElementById("avg-time");
    const startTime = 0;
    const duration = 1500;
    const start = Date.now();

    const timer = setInterval(() => {
        const timePassed = Date.now() - start;
        const progress = timePassed / duration;

        if (progress >= 1) {
            clearInterval(timer);
            avgTimeEl.textContent = avgTime.toFixed(2);
        } else {
            avgTimeEl.textContent = (avgTime * progress).toFixed(2);
        }
    }, 16);

    // Event handlers for buttons


    document.getElementById("retry-topic").addEventListener("click", async () => {
        // Retry with new questions from same topic
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';
        document.getElementById('quiz-container').classList.add('hidden');
        quizResults.classList.remove("show");
        quizResults.classList.add("hidden");

        score = 0;
        correctCount = 0;
        wrongCount = 0;
        totalTime = 0;
        currentQuestionIndex = 0;
        quizContainer.classList.remove("hidden");

        await loadQuiz(); // Tải bộ câu hỏi mới

        spinner.style.display = 'none';
        document.getElementById('quiz-container').classList.remove('hidden');
    });

    document.getElementById("retry-quiz").addEventListener("click", async () => {
        // Retry current quiz with same questions
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';
        document.getElementById('quiz-container').classList.add('hidden');
        quizResults.classList.remove("show");
        quizResults.classList.add("hidden");

        score = 0;
        correctCount = 0;
        wrongCount = 0;
        totalTime = 0;
        currentQuestionIndex = 0;
        quizContainer.classList.remove("hidden");

        // Không gọi loadQuiz() để giữ nguyên bộ câu hỏi hiện tại
        displayQuestion(0);

        spinner.style.display = 'none';
        document.getElementById('quiz-container').classList.remove('hidden');
    });

    document.getElementById("return-home").addEventListener("click", () => {window.location.href = "index.html";});
}

// Hàm tạo hiệu ứng confetti
function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confetti ${1 + Math.random() * 2}s linear forwards`;
        confetti.style.opacity = '1';
        confettiContainer.appendChild(confetti);

        // Xóa confetti sau khi animation kết thúc
        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    }
}

// Hàm animation số đếm
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    const startTime = Date.now();

    const timer = setInterval(() => {
        const timePassed = Date.now() - startTime;
        const progress = timePassed / duration;

        if (progress >= 1) {
            clearInterval(timer);
            element.textContent = end;
        } else {
            const currentValue = Math.round(start + (range * progress));
            element.textContent = currentValue;
        }
    }, 16);
}

document.getElementById("next-question").addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion(currentQuestionIndex);
    } else {
        endQuiz();
    }
});