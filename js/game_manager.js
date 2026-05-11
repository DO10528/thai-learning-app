class GameManager {
    constructor() {
        this.currentLevel = 1;
        this.currentCategory = 'consonants';
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.currentData = [];
        this.currentQuestion = null;
        this.dailyTracker = this.loadDailyTracker();
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const levelBtns = document.querySelectorAll('.level-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentLevel = parseInt(btn.dataset.level);
                this.startGame();
            });
        });

        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
            });
        });

        const listenBtn = document.getElementById('listen-btn');
        if (listenBtn) {
            listenBtn.addEventListener('click', () => {
                this.playQuestion();
            });
        }

        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.showScreen('start-screen');
            });
        }

        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    loadDailyTracker() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('thaiGameDailyTracker');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === today) {
                return data;
            }
        }
        return { date: today, answeredQuestions: [] };
    }

    saveDailyTracker() {
        localStorage.setItem('thaiGameDailyTracker', JSON.stringify(this.dailyTracker));
    }

    isQuestionAnsweredToday(questionId) {
        return this.dailyTracker.answeredQuestions.includes(questionId);
    }

    markQuestionAnswered(questionId) {
        if (!this.isQuestionAnsweredToday(questionId)) {
            this.dailyTracker.answeredQuestions.push(questionId);
            this.saveDailyTracker();
        }
    }

    startGame() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.updateScore();
        this.loadCategoryData();
        this.shuffleData();
        this.showScreen('game-screen');
        this.nextQuestion();
    }

    loadCategoryData() {
        switch (this.currentCategory) {
            case 'consonants':
                this.currentData = [...thaiAlphabet.consonants];
                break;
            case 'vowels':
                this.currentData = [...thaiAlphabet.vowels];
                break;
            case 'finals':
                this.currentData = [...thaiAlphabet.finals];
                break;
        }
    }

    shuffleData() {
        for (let i = this.currentData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentData[i], this.currentData[j]] = [this.currentData[j], this.currentData[i]];
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endGame();
            return;
        }

        this.currentQuestion = this.currentData[this.currentQuestionIndex];
        this.currentQuestionIndex++;
        this.updateProgress();
        this.renderOptions();
        this.playQuestion();
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (progressFill) {
            const percentage = (this.currentQuestionIndex / this.totalQuestions) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${this.currentQuestionIndex} / ${this.totalQuestions}`;
        }
    }

    playQuestion() {
        let text = '';
        if (this.currentQuestion.name) {
            text = `${this.currentQuestion.name} อยู่ไหน?`;
        } else if (this.currentQuestion.group) {
            text = `${this.currentQuestion.group} อยู่ไหน?`;
        }
        audioManager.playWithWebSpeech({ question: text });
    }

    renderOptions() {
        const optionsGrid = document.getElementById('options-grid');
        if (!optionsGrid) return;

        optionsGrid.innerHTML = '';

        let options = [this.currentQuestion];
        const numOptions = this.currentLevel + 1;

        const otherData = this.currentData.filter(item => item !== this.currentQuestion);
        for (let i = otherData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherData[i], otherData[j]] = [otherData[j], otherData[i]];
        }

        for (let i = 0; i < numOptions - 1 && i < otherData.length; i++) {
            options.push(otherData[i]);
        }

        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        options.forEach((option, index) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.index = index;

            const img = document.createElement('img');
            img.src = option.illustration;
            img.alt = option.name || option.group;
            img.className = 'option-img';

            card.appendChild(img);

            card.addEventListener('click', () => {
                this.handleAnswer(option);
            });

            optionsGrid.appendChild(card);
        });
    }

    handleAnswer(selectedOption) {
        const isCorrect = selectedOption === this.currentQuestion;
        const questionId = `${this.currentCategory}-${this.currentQuestionIndex}-${selectedOption.name || selectedOption.group}`;

        if (isCorrect) {
            if (!this.isQuestionAnsweredToday(questionId)) {
                this.score++;
                this.markQuestionAnswered(questionId);
                this.updateScore();
            }
            this.showCorrectFeedback();
            audioManager.playCorrect();
            this.createConfetti();

            setTimeout(() => {
                this.nextQuestion();
            }, 1500);
        } else {
            this.showWrongFeedback();
            audioManager.playWrong();
        }
    }

    showCorrectFeedback() {
        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.classList.add('correct');
        });
    }

    showWrongFeedback() {
        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.classList.add('wrong');
            setTimeout(() => {
                card.classList.remove('wrong');
            }, 500);
        });
    }

    updateScore() {
        const scoreValue = document.getElementById('score');
        if (scoreValue) {
            scoreValue.textContent = this.score;
        }
    }

    endGame() {
        this.showScreen('result-screen');
        const finalScore = document.getElementById('final-score');
        if (finalScore) {
            finalScore.textContent = this.score;
        }
        this.showStars();
    }

    showStars() {
        const starsContainer = document.getElementById('result-stars');
        if (!starsContainer) return;

        starsContainer.innerHTML = '';
        const percentage = this.score / this.totalQuestions;
        let numStars = 0;
        if (percentage >= 0.8) numStars = 3;
        else if (percentage >= 0.5) numStars = 2;
        else if (percentage >= 0.3) numStars = 1;

        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = i < numStars ? '⭐' : '☆';
            starsContainer.appendChild(star);
        }
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.backgroundColor = this.getRandomColor();
            container.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 2000);
        }
    }

    getRandomColor() {
        const colors = ['#E53E3E', '#ED64A6', '#ED8936', '#ECC94B', '#48BB78', '#4299E1', '#9F7AEA'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
}

const gameManager = new GameManager();
