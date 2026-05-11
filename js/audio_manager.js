class AudioManager {
    constructor() {
        this.currentAudio = null;
        this.audioCache = new Map();
        this.isPlaying = false;
        this.currentUtterance = null;
        this.audioContext = null;
    }

    async playSound(data) {
        try {
            if (this.isPlaying) {
                this.stop();
            }

            if (data.audio && data.audio.trim() !== '') {
                await this.playFromFile(data.audio);
            } else {
                await this.playWithWebSpeech(data);
            }
        } catch (error) {
            console.error('Audio playback error:', error);
            await this.playWithWebSpeech(data);
        }
    }

    async playFromFile(audioUrl) {
        return new Promise((resolve, reject) => {
            if (this.audioCache.has(audioUrl)) {
                this.currentAudio = this.audioCache.get(audioUrl);
            } else {
                this.currentAudio = new Audio(audioUrl);
                this.currentAudio.preload = 'auto';
                this.audioCache.set(audioUrl, this.currentAudio);
            }

            this.isPlaying = true;

            this.currentAudio.onended = () => {
                this.isPlaying = false;
                this.currentAudio = null;
                resolve();
            };

            this.currentAudio.onerror = (error) => {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(error);
            };

            this.currentAudio.play().catch((err) => {
                this.isPlaying = false;
                this.currentAudio = null;
                reject(err);
            });
        });
    }

    async playWithWebSpeech(data) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                this.isPlaying = false;
                resolve();
                return;
            }

            let text = '';
            if (data.name) {
                text = data.name;
            } else if (data.group && data.example) {
                text = data.group + ' ' + data.example;
            } else if (data.character) {
                text = data.character;
            } else if (data.question) {
                text = data.question;
            }

            if (!text) {
                this.isPlaying = false;
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';
            utterance.rate = 0.7;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            this.isPlaying = true;
            this.currentUtterance = utterance;

            const voices = speechSynthesis.getVoices();
            const thaiVoice = voices.find(voice => voice.lang === 'th-TH');
            if (thaiVoice) {
                utterance.voice = thaiVoice;
            }

            utterance.onstart = () => {
                this.isPlaying = true;
            };

            utterance.onend = () => {
                this.isPlaying = false;
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isPlaying = false;
                this.currentUtterance = null;
                resolve();
            };

            speechSynthesis.cancel();
            setTimeout(() => {
                speechSynthesis.speak(utterance);
            }, 50);
        });
    }

    async playCorrect() {
        await this.playWithWebSpeech({ question: 'ถูกต้อง!' });
    }

    async playWrong() {
        await this.playWithWebSpeech({ question: 'ลองอีกครั้ง!' });
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        this.currentUtterance = null;
        this.isPlaying = false;
    }
}

const audioManager = new AudioManager();
