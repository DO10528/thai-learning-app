class WritingGame {
    constructor() {
        this.currentLevel = 1;
        this.currentCategory = 'consonants';
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.currentData = [];
        this.currentQuestion = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#000000';
        this.lineWidth = 15;
        this.drawingCanvas = null;
        this.drawingCtx = null;
        this.guideCanvas = null;
        this.guideCtx = null;
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

        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = btn.dataset.color;
            });
        });

        const eraserBtn = document.getElementById('eraser-btn');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                this.clearCanvas();
            });
        }

        const checkBtn = document.getElementById('check-btn');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                this.checkWriting();
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

    startGame() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.updateScore();
        this.loadCategoryData();
        this.shuffleData();
        this.showScreen('game-screen');
        this.initCanvas();
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
        }
    }

    shuffleData() {
        for (let i = this.currentData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentData[i], this.currentData[j]] = [this.currentData[j], this.currentData[i]];
        }
    }

    initCanvas() {
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.guideCanvas = document.getElementById('guide-canvas');
        
        if (!this.drawingCanvas || !this.guideCanvas) return;

        const container = this.drawingCanvas.parentElement;
        const size = Math.min(container.clientWidth, 400);
        
        this.drawingCanvas.width = size;
        this.drawingCanvas.height = size;
        this.guideCanvas.width = size;
        this.guideCanvas.height = size;

        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.guideCtx = this.guideCanvas.getContext('2d');

        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        this.drawingCtx.lineWidth = this.lineWidth;

        this.setupDrawingEvents();
    }

    setupDrawingEvents() {
        if (!this.drawingCanvas) return;

        this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawingCanvas.addEventListener('mouseout', () => this.stopDrawing());

        this.drawingCanvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.drawingCanvas.addEventListener('touchmove', (e) => this.draw(e));
        this.drawingCanvas.addEventListener('touchend', () => this.stopDrawing());
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    draw(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        const pos = this.getPosition(e);
        this.drawingCtx.strokeStyle = this.currentColor;
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(this.lastX, this.lastY);
        this.drawingCtx.lineTo(pos.x, pos.y);
        this.drawingCtx.stroke();

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    getPosition(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        let x, y;

        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        return { x, y };
    }

    clearCanvas() {
        if (this.drawingCtx) {
            this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        }
    }

    drawGuide() {
        if (!this.guideCtx || !this.currentQuestion) return;

        this.guideCtx.clearRect(0, 0, this.guideCanvas.width, this.guideCanvas.height);

        if (this.currentLevel === 1) {
            const size = this.guideCanvas.width;
            const fontSize = size * 0.6;

            this.guideCtx.font = `${fontSize}px 'Itim', cursive`;
            this.guideCtx.textAlign = 'center';
            this.guideCtx.textBaseline = 'middle';
            this.guideCtx.fillStyle = '#E0E0E0';

            let displayChar = this.currentQuestion.character;
            if (displayChar && displayChar.includes('-')) {
                displayChar = displayChar.replace('-', 'อ');
            }

            this.guideCtx.fillText(displayChar, size / 2, size / 2);
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
        this.renderQuestion();
        this.clearCanvas();
        this.drawGuide();
        this.hideFeedback();
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

    renderQuestion() {
        const modelCharacter = document.getElementById('model-character');
        if (modelCharacter && this.currentQuestion) {
            let displayChar = this.currentQuestion.character;
            if (displayChar && displayChar.includes('-')) {
                displayChar = displayChar.replace('-', 'อ');
            }
            modelCharacter.textContent = displayChar;
        }
    }

    checkWriting() {
        const accuracy = this.calculateAccuracy();
        
        if (accuracy >= 80) {
            this.score++;
            this.updateScore();
            this.showFeedback('เขียนสวยมาก! ✔', 'success');
            audioManager.playCorrect();
            this.createConfetti();

            setTimeout(() => {
                this.nextQuestion();
            }, 1500);
        } else {
            this.showFeedback('ลองอีกครั้ง!', 'error');
            audioManager.playWrong();
        }
    }

    calculateAccuracy() {
        if (!this.drawingCanvas) return 0;

        const size = this.drawingCanvas.width;
        
        // Create offscreen canvas for comparison
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        
        const fontSize = size * 0.6;
        offCtx.font = `${fontSize}px 'Itim', cursive`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        
        let displayChar = this.currentQuestion.character;
        if (displayChar && displayChar.includes('-')) {
            displayChar = displayChar.replace('-', 'อ');
        }

        // --- Calculate "Precision" (how much of drawing is within tolerance) ---
        offCtx.clearRect(0, 0, size, size);
        offCtx.fillStyle = '#000000';
        offCtx.strokeStyle = '#000000';
        offCtx.lineWidth = 40; // Wide tolerance
        offCtx.lineJoin = 'round';
        offCtx.strokeText(displayChar, size / 2, size / 2);
        offCtx.fillText(displayChar, size / 2, size / 2);
        
        const toleranceData = offCtx.getImageData(0, 0, size, size).data;
        const drawnData = this.drawingCtx.getImageData(0, 0, size, size).data;
        
        let drawnPixels = 0;
        let insideTolerancePixels = 0;
        
        for (let i = 0; i < drawnData.length; i += 4) {
            if (drawnData[i + 3] > 0) { // Check if user drew here (alpha > 0)
                drawnPixels++;
                if (toleranceData[i + 3] > 0) {
                    insideTolerancePixels++;
                }
            }
        }
        
        if (drawnPixels === 0) return 0; // Did not draw anything
        
        const precision = insideTolerancePixels / drawnPixels;

        // --- Calculate "Coverage" (how much of core text is covered) ---
        offCtx.clearRect(0, 0, size, size);
        offCtx.lineWidth = 1;
        offCtx.fillText(displayChar, size / 2, size / 2);
        
        const coreData = offCtx.getImageData(0, 0, size, size).data;
        
        let corePixels = 0;
        let coveredCorePixels = 0;
        
        for (let i = 0; i < drawnData.length; i += 4) {
            if (coreData[i + 3] > 0) {
                corePixels++;
                if (drawnData[i + 3] > 0) {
                    coveredCorePixels++;
                }
            }
        }
        
        const coverage = corePixels > 0 ? (coveredCorePixels / corePixels) : 0;
        
        // Final accuracy score (weighted average: coverage 60%, precision 40%)
        const accuracy = (coverage * 0.6 + precision * 0.4) * 100;
        
        // Adjust score to be slightly forgiving for kids
        let adjustedAccuracy = accuracy * 1.2; 
        if (adjustedAccuracy > 100) adjustedAccuracy = 100;
        
        return Math.round(adjustedAccuracy);
    }

    showFeedback(message, type) {
        const feedbackEl = document.getElementById('feedback-message');
        if (feedbackEl) {
            feedbackEl.textContent = message;
            feedbackEl.className = 'feedback-message ' + type;
            feedbackEl.style.display = 'block';
        }
    }

    hideFeedback() {
        const feedbackEl = document.getElementById('feedback-message');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }
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

const writingGame = new WritingGame();
