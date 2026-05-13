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

            // 再生中のものを強制停止
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

            // 【重要】「สระ(サラ)」を完全に削除し、純粋な母音だけにする
            let cleanText = rawText.replace(/สระ/g, '').trim();

            this.isPlaying = true;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'th-TH';

            // 【重要】短母音リスト（エッ、イヤッ等）
            const shortVowels = ['เออะ', 'เอียะ', 'อิ', 'อุ', 'อะ', 'เอะ', 'แอะ', 'โอะ', 'เอาะ'];

            if (shortVowels.includes(cleanText)) {
                // 短くキレよく発音（スピード1.6倍）
                utterance.rate = 1.6;
                utterance.pitch = 1.3; // 若いお姉さんの声（高め）
            } else if (cleanText === 'ถูกต้อง!' || cleanText === 'ลองอีกครั้ง!') {
                // システムメッセージ用
                utterance.rate = 1.0;
                utterance.pitch = 1.2;
            } else {
                // 通常の長母音や子音
                utterance.rate = 0.9;
                utterance.pitch = 1.2;
            }
            
            utterance.volume = 1.0;

            // 女性ボイスの選択
            const thaiVoices = this.voices.filter(voice => 
                voice.lang === 'th-TH' || voice.lang.startsWith('th')
            );

            let selectedVoice = null;
            // 優先順位：Googleの女性声 ＞ Siriの女性声 ＞ その他女性
            const preferredKeywords = ['google', 'siri', 'female', 'woman', 'หญิง'];
            
            for (const kw of preferredKeywords) {
                selectedVoice = thaiVoices.find(v => v.name.toLowerCase().includes(kw));
                if (selectedVoice) break;
            }

            if (!selectedVoice && thaiVoices.length > 0) {
                selectedVoice = thaiVoices;
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

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

            // ブラウザのフリーズ防止タイマー
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