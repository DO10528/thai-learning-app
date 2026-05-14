class PronunciationGame {
    constructor() {
        this.currentLevel = 1;
        this.currentCategory = 'consonants';
        this.totalScore = 0;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 10;
        this.currentData = [];
        this.currentQuestion = null;
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.bindEvents();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'th-TH';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateMicButton(true);
                this.startVisualizer();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                this.evaluatePronunciation(transcript, confidence);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopListening();
                this.showFeedback('ลองอีกครั้ง!', 'error');
            };

            this.recognition.onend = () => {
                this.stopListening();
            };
        }
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

        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (this.isListening) {
                    this.recognition.stop();
                } else {
                    this.startListening();
                }
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
        this.totalScore = 0;
        this.currentQuestionIndex = 0;
        this.updateTotalScore();
        this.loadCategoryData();
        this.selectQuestions();
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

    selectQuestions() {
        switch (this.currentLevel) {
            case 1:
                this.currentData = this.currentData.slice(0, this.totalQuestions);
                break;
            case 2:
                const half = Math.floor(this.currentData.length / 2);
                this.shuffleArray(this.currentData);
                this.currentData = this.currentData.slice(0, this.totalQuestions);
                break;
            case 3:
                this.shuffleArray(this.currentData);
                this.currentData = this.currentData.slice(0, this.totalQuestions);
                break;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
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
        const targetCharacter = document.getElementById('target-character');
        const targetName = document.getElementById('target-name');
        const scoreLabel = document.getElementById('score-label');
        const currentScore = document.getElementById('current-score');

        if (targetCharacter) {
            targetCharacter.textContent = this.currentQuestion.character || this.currentQuestion.group || '';
        }
        if (targetName) {
            targetName.textContent = this.currentQuestion.name || this.currentQuestion.desc || '';
        }
        if (scoreLabel) {
            scoreLabel.textContent = 'กดไมค์เพื่ออ่าน!';
        }
        if (currentScore) {
            currentScore.textContent = '-';
        }
    }

    startListening() {
        if (!this.recognition) {
            alert('เบราว์เซอร์ของคุณไม่รองรับการรับความรู้เสียง');
            return;
        }
        try {
            this.recognition.start();
        } catch (e) {
            console.error('Recognition start error:', e);
        }
    }

    stopListening() {
        this.isListening = false;
        this.updateMicButton(false);
        this.stopVisualizer();
    }

    updateMicButton(isListening) {
        const micBtn = document.getElementById('mic-btn');
        const micText = document.getElementById('mic-text');
        if (micBtn) {
            micBtn.classList.toggle('listening', isListening);
        }
        if (micText) {
            micText.textContent = isListening ? 'กำลังฟัง...' : 'กดเพื่ออ่าน';
        }
    }

    startVisualizer() {
        const container = document.getElementById('visualizer-container');
        if (container) {
            container.classList.add('active');
        }
    }

    stopVisualizer() {
        const container = document.getElementById('visualizer-container');
        if (container) {
            container.classList.remove('active');
        }
    }

    evaluatePronunciation(transcript, confidence) {
        const score = Math.round(confidence * 100);
        const currentScoreEl = document.getElementById('current-score');
        const scoreLabel = document.getElementById('score-label');

        if (currentScoreEl) {
            currentScoreEl.textContent = `${score}%`;
        }
        if (scoreLabel) {
            scoreLabel.textContent = 'คะแนน:';
        }

        const targetText = this.currentQuestion.name || this.currentQuestion.character || this.currentQuestion.group || '';
        const isMatch = this.checkMatch(transcript, targetText);

        if (score >= 80 || (isMatch && score >= 60)) {
            this.totalScore += score;
            this.updateTotalScore();
            this.showFeedback('เยี่ยมมาก! ✔', 'success');
            audioManager.playCorrect();
            this.createConfetti();

            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        } else {
            this.showFeedback('ลองอีกครั้ง!', 'error');
            audioManager.playWrong();
        }
    }

    checkMatch(transcript, target) {
        const cleanTranscript = transcript.toLowerCase().replace(/\s/g, '');
        const cleanTarget = target.toLowerCase().replace(/\s/g, '');
        
        if (cleanTranscript.includes(cleanTarget) || cleanTarget.includes(cleanTranscript)) {
            return true;
        }

        const similarity = this.calculateSimilarity(cleanTranscript, cleanTarget);
        return similarity >= 0.8;
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
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

    updateTotalScore() {
        const totalScoreEl = document.getElementById('total-score');
        if (totalScoreEl) {
            totalScoreEl.textContent = this.totalScore;
        }
    }

    endGame() {
        this.showScreen('result-screen');
        const finalScore = document.getElementById('final-score');
        if (finalScore) {
            finalScore.textContent = this.totalScore;
        }
        this.showStars();
    }

    showStars() {
        const starsContainer = document.getElementById('result-stars');
        if (!starsContainer) return;

        starsContainer.innerHTML = '';
        const maxPossibleScore = this.totalQuestions * 100;
        const percentage = this.totalScore / maxPossibleScore;
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

const pronunciationGame = new PronunciationGame();
