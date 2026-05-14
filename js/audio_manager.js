class AudioManager {
    constructor() {
        this.currentAudio = null;
        this.audioCache = new Map();
        this.isPlaying = false;
        this.currentUtterance = null;
        this.voices = [];
        this.loadVoices();
    }

    loadVoices() {
        if ('speechSynthesis' in window) {
            const updateVoices = () => {
                this.voices = speechSynthesis.getVoices();
            };
            updateVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = updateVoices;
            }
        }
    }

    async playSound(data) {
        try {
            if (this.isPlaying) {
                this.stop();
            }

            // 1. 自作音声ファイル(audio)がある場合は最優先で再生
            if (data.audio && data.audio.trim() !== '') {
                await this.playFromFile(data.audio);
            } 
            // 2. ファイルがない場合はAI音声(WebSpeech)で再生
            else {
                await this.playWithWebSpeech(data);
            }
        } catch (error) {
            console.error('Audio playback error:', error);
            // エラー時はバックアップとしてAI音声
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

            // 前の音声をキャンセル
            speechSynthesis.cancel();

            let rawText = '';
            if (data.name) rawText = data.name;
            else if (data.group && data.example) rawText = data.group + ' ' + data.example;
            else if (data.character) rawText = data.character;
            else if (data.question) rawText = data.question;

            if (!rawText) {
                this.isPlaying = false;
                resolve();
                return;
            }

            // 【重要】「สระ(サラ)」を完全に削除
            let cleanText = rawText.replace(/สระ/g, '').trim();

            this.isPlaying = true;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'th-TH';

            // --- 【個別発音調整プロトコル】 ---
            
            if (cleanText === 'เอียะ') {
                // イアッ(Ia)専用：ゆっくり、はっきりと
                utterance.rate = 0.75; 
                utterance.pitch = 1.1; 
            } else if (['อิ', 'อุ', 'อะ', 'เอะ', 'แอะ', 'โอะ', 'เอาะ'].includes(cleanText)) {
                // その他の短母音：速く、キレよく（エッはファイル優先なのでここには来ません）
                utterance.rate = 1.6;
                utterance.pitch = 1.3;
            } else if (cleanText === 'ถูกต้อง!' || cleanText === 'ลองอีกครั้ง!') {
                utterance.rate = 1.0;
                utterance.pitch = 1.2;
            } else {
                // 標準（長母音や子音）
                utterance.rate = 0.8;
                utterance.pitch = 1.2;
            }
            
            // --------------------------------

            utterance.volume = 1.0;

            // 女性ボイスの優先選択
            const thaiVoices = this.voices.filter(voice => 
                voice.lang === 'th-TH' || voice.lang.startsWith('th')
            );
            let selectedVoice = null;
            const preferredKeywords = ['google', 'siri', 'female', 'woman', 'หญิง'];
            for (const kw of preferredKeywords) {
                selectedVoice = thaiVoices.find(v => v.name.toLowerCase().includes(kw));
                if (selectedVoice) break;
            }
            if (selectedVoice) utterance.voice = selectedVoice;

            utterance.onend = () => {
                this.isPlaying = false;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isPlaying = false;
                resolve();
            };

            speechSynthesis.speak(utterance);

            // セーフティタイマー
            setTimeout(() => {
                if (this.isPlaying) {
                    this.isPlaying = false;
                    resolve();
                }
            }, 5000);
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
        this.isPlaying = false;
    }
}

const audioManager = new AudioManager();