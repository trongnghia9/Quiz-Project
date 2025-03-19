# Quiz Generator Website

## Overview
This is a simple front-end-only quiz generation website built with HTML and Tailwind CSS. The website allows users to generate quizzes related to information technology using the Gemini API. It consists of two main pages:

- **Home Page:** Where users can initiate quiz generation.
- **Quiz Progress Page:** Displays the quiz questions and handles user interactions.

## Features
- **Quiz Generation:** Users can create an IT-related quiz by clicking a button on the home page.
- **Dynamic Questions:** Uses the Gemini API to generate quiz questions, answers, and explanations.
- **Automated Grading:** When users submit their answers, the system evaluates responses and highlights incorrect answers.

## Technologies Used
- **HTML**: Markup language for structuring the website.
- **Tailwind CSS**: For styling and responsive design.
- **Gemini API**: Used to generate quiz questions and answers dynamically.

## How It Works
1. Users visit the **home page** and click on the "Create IT Quiz" button.
2. The website navigates to the **quiz progress page** where generated questions appear.
3. Users select their answers and submit the quiz.
4. The system evaluates the answers, marks incorrect ones, and provides explanations.

## Setup & Usage
1. Clone this repository:
   ```sh
   git clone https://github.com/phuccan0800/Quiz-Project.git
   cd quiz-generator
   ```
2. Open `index.html` in a browser to run the website.
3. Ensure you have access to the Gemini API to fetch quiz questions.

## Future Enhancements
- Improve UI/UX with animations and transitions.
- Support multiple quiz categories beyond IT.
- Store user progress and scores using local storage.

## License
This project is open-source and available under the MIT License.

