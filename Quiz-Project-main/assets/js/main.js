// Navbar scroll effect
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Particle animation
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize);

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = (Math.random() - 0.5) * 1;
    this.radius = Math.random() * 3;
    this.color = `rgba(${Math.random() * 100 + 155}, ${
      Math.random() * 100 + 155
    }, 255, ${Math.random() * 0.3 + 0.2})`;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx * 0.9;
    if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy * 0.9;
  }
}

function initParticles() {
  for (let i = 0; i < 150; i++) {
    particles.push(new Particle());
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });
  requestAnimationFrame(animate);
}

initParticles();
animate();

// Lấy các phần tử trong DOM
const modal = document.getElementById('quizModal');
const btn = document.getElementById('createQuizBtn');
const span = document.getElementsByClassName('close')[0];
const quizForm = document.getElementById('quizForm');

// Khi nhấn nút "Start Quiz" -> Hiển thị popup
btn.onclick = function() {
    modal.style.display = 'block';
}

span.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Form submission handling
quizForm.onsubmit = async function(e) {
    e.preventDefault();
    const topic = document.getElementById('quizTitle').value;
    const language = document.getElementById('quizLanguage').value;
    const numberOfQuestions = document.getElementById('questionCount').value;
    // Save quiz data with ID
    localStorage.setItem('quizData', JSON.stringify({
        topic: topic,
        language: language,
        numberOfQuestions: numberOfQuestions,
    }));

    // Redirect to quiz page
    window.location.href = 'quiz.html';
} 