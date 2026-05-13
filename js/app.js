document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderConsonants();
    renderVowels();
    renderFinals();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function renderConsonants() {
    const grid = document.getElementById('consonants-grid');
    grid.innerHTML = '';
    
    thaiAlphabet.consonants.forEach((consonant, index) => {
        const card = createCharacterCard(consonant, index);
        grid.appendChild(card);
    });
}

function renderVowels() {
    const grid = document.getElementById('vowels-grid');
    grid.innerHTML = '';
    
    thaiAlphabet.vowels.forEach((vowel, index) => {
        const card = createCharacterCard(vowel, index);
        grid.appendChild(card);
    });
}

function renderFinals() {
    const grid = document.getElementById('finals-grid');
    grid.innerHTML = '';
    
    thaiAlphabet.finals.forEach((final, index) => {
        const card = createFinalCard(final, index);
        grid.appendChild(card);
    });
}

function createCharacterCard(data, index) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.index = index;
    
    const character = document.createElement('div');
    character.className = 'character';
    
    let displayChar = data.character;
    if (displayChar.includes('-')) {
        displayChar = displayChar.replace('-', 'ก');
    }
    character.textContent = displayChar;
    
    const name = document.createElement('div');
    name.className = 'character-name';
    name.textContent = data.name;
    
    card.appendChild(character);
    card.appendChild(name);
    
    card.addEventListener('click', async () => {
        await playCharacterSound(card, data);
    });
    
    return card;
}

function createFinalCard(data, index) {
    const card = document.createElement('div');
    card.className = 'final-card';
    card.dataset.index = index;
    
    const group = document.createElement('div');
    group.className = 'final-group';
    group.textContent = data.group;
    
    const example = document.createElement('div');
    example.className = 'final-example';
    example.textContent = data.example;
    
    const desc = document.createElement('div');
    desc.className = 'final-desc';
    desc.textContent = data.desc;
    
    card.appendChild(group);
    card.appendChild(example);
    card.appendChild(desc);
    
    card.addEventListener('click', async () => {
        await playFinalSound(card, data);
    });
    
    return card;
}

async function playCharacterSound(card, data) {
    if (card.classList.contains('playing')) {
        return;
    }
    
    card.classList.add('playing');
    
    try {
        await audioManager.playSound(data);
    } finally {
        setTimeout(() => {
            card.classList.remove('playing');
        }, 500);
    }
}

async function playFinalSound(card, data) {
    if (card.classList.contains('playing')) {
        return;
    }
    
    card.classList.add('playing');
    
    try {
        await audioManager.playSound(data);
    } finally {
        setTimeout(() => {
            card.classList.remove('playing');
        }, 500);
    }
}
