// app.js

// STATE MANAGEMENT
const state = {
    currentRankIndex: 0,
    ranks: ['Observer', 'Experimenter', 'Researcher'],
    force: 0,
    baseWireLength: 150, // Base wire height in px
    permanentDeformation: 0, // Permanent stretch in px
    elasticLimitForce: 50, // Hidden internal threshold
    plasticYieldRate: 0.8, // Rate of plastic extension per force unit
    observations: [],
    hasExceededElasticLimit: false,
    hasReturnedToZeroAfterPlastic: false
};

// DOM ELEMENTS
const dom = {
    homeScreen: document.getElementById('home-screen'),
    experimentScreen: document.getElementById('experiment-screen'),
    btnStartExp: document.getElementById('btn-start-exp'),
    btnReset: document.getElementById('btn-reset'),
    btnSaveObs: document.getElementById('btn-save-obs'),
    btnCompleteExp: document.getElementById('btn-complete-exp'),
    btnCloseCert: document.getElementById('btn-close-cert'),
    certModal: document.getElementById('cert-modal'),
    
    rankDisplay: document.getElementById('rank-display'),
    certRank: document.getElementById('cert-rank'),
    
    forceSlider: document.getElementById('force-slider'),
    forceValDisplay: document.getElementById('force-val-display'),
    sliderForceReadout: document.getElementById('slider-force-readout'),
    steelWire: document.getElementById('steel-wire'),
    
    fluxDialogue: document.getElementById('flux-dialogue'),
    homeFluxAvatar: document.getElementById('home-flux-avatar'),
    expFluxAvatar: document.getElementById('exp-flux-avatar'),
    
    obsInput: document.getElementById('obs-input'),
    obsList: document.getElementById('obs-list')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateRankUI();
});

// EVENT LISTENERS
function setupEventListeners() {
    dom.btnStartExp.addEventListener('click', () => switchScreen('experiment'));
    dom.btnReset.addEventListener('click', resetExperiment);
    dom.btnSaveObs.addEventListener('click', saveObservation);
    dom.btnCompleteExp.addEventListener('click', finishExperiment);
    dom.btnCloseCert.addEventListener('click', () => {
        dom.certModal.classList.remove('active');
        switchScreen('home');
    });

    dom.forceSlider.addEventListener('input', handleForceChange);
}

// NAVIGATION
function switchScreen(screenName) {
    if (screenName === 'experiment') {
        dom.homeScreen.classList.remove('active');
        dom.experimentScreen.classList.add('active');
        if (state.currentRankIndex === 0) {
            upgradeRank(1); // Upgrade to Experimenter on starting
        }
    } else {
        dom.experimentScreen.classList.remove('active');
        dom.homeScreen.classList.add('active');
    }
}

// CORE SIMULATION LOGIC
function handleForceChange(e) {
    const force = parseInt(e.target.value, 10);
    state.force = force;
    
    dom.forceValDisplay.textContent = `${force} N`;
    dom.sliderForceReadout.textContent = `${force} N`;

    // Calculate Wire Physics
    let elasticStretch = 0;
    
    if (force <= state.elasticLimitForce) {
        // Linear Elastic Region (Hooke's Law zone)
        elasticStretch = force * 0.6;
    } else {
        // Plastic Region
        state.hasExceededElasticLimit = true;
        
        // Dynamic calculation for plastic stretch
        const excessForce = force - state.elasticLimitForce;
        elasticStretch = state.elasticLimitForce * 0.6; // Max elastic extension
        
        // Permanent deformation accumulates based on peak force reached
        const currentPlasticStretch = excessForce * state.plasticYieldRate;
        if (currentPlasticStretch > state.permanentDeformation) {
            state.permanentDeformation = currentPlasticStretch;
        }
    }

    // Total length = base length + permanent deformation + temporary elastic stretch
    const currentTotalLength = state.baseWireLength + state.permanentDeformation + elasticStretch;
    
    // Wire thins out as it stretches
    const newThickness = Math.max(1.5, 4 - (currentTotalLength - state.baseWireLength) * 0.03);

    // Apply visual styles
    dom.steelWire.style.height = `${currentTotalLength}px`;
    dom.steelWire.style.width = `${newThickness}px`;

    // Check zero load condition after plastic stretch
    if (force === 0 && state.permanentDeformation > 0) {
        state.hasReturnedToZeroAfterPlastic = true;
    }

    // Trigger Flux Dynamic Dialogue based on current behavior
    updateFluxFeedback(force);
}

// FLUX REACTION ENGINE (Hinglish Discovery Hints)
function updateFluxFeedback(force) {
    if (force === 0) {
        if (state.permanentDeformation > 0) {
            setFluxText("Interesting... Load toh zero ho gaya par wire abhi bhi pehle se lamba lag raha hai! Kya hua hoga?", "surprised");
        } else {
            setFluxText("Wire normal length par hai. Load badha kar dekho kya hota hai!", "normal");
        }
    } else if (force > 0 && force <= 20) {
        setFluxText("Sab normal lag raha hai. Force badhane par wire thoda stretch ho raha hai.", "normal");
    } else if (force > 20 && force <= 45) {
        setFluxText("Hmmm... Wire stretch toh ho raha hai. Try removing the load and observe if it goes back!", "thinking");
    } else if (force > 45 && force <= 65) {
        if (state.permanentDeformation > 0) {
            setFluxText("Arre! Kuch interesting notice hua? Dynamic change ho raha hai!", "excited");
        } else {
            setFluxText("Notice karo! Tension badh raha hai. Kya wire abhi bhi reversible hai?", "thinking");
        }
    } else if (force > 65) {
        setFluxText("Oooh! Wire bohot stretch ho gaya hai. Wire ab pehle jaisa nahi lag raha. Force zero karke dekho kya wapas aata hai?", "shocked");
    }
}

function setFluxText(text, mood) {
    dom.fluxDialogue.textContent = text;
    
    // Simple visual feedback via scaling
    if (mood === 'excited' || mood === 'shocked') {
        dom.expFluxAvatar.style.transform = 'scale(1.2)';
    } else {
        dom.expFluxAvatar.style.transform = 'scale(1)';
    }
}

// OBSERVATION SYSTEM
function saveObservation() {
    const text = dom.obsInput.value.trim();
    if (!text) return;

    state.observations.push(text);
    dom.obsInput.value = '';
    
    renderObservations();

    // Unlock higher rank if student is engaged in active observation
    if (state.observations.length >= 2 && state.currentRankIndex < 2 && state.hasExceededElasticLimit) {
        upgradeRank(2); // Researcher
    }

    setFluxText("Observation note ho gayi! Aur values try karke pattern khojo.", "excited");
}

function renderObservations() {
    if (state.observations.length === 0) {
        dom.obsList.innerHTML = `<li class="empty-msg">Abhi koi observation record nahi hui hai.</li>`;
        return;
    }

    dom.obsList.innerHTML = state.observations.map(obs => `
        <li>${escapeHtml(obs)}</li>
    `).join('');
}

function escapeHtml(string) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// RESET SYSTEM
function resetExperiment() {
    state.force = 0;
    state.permanentDeformation = 0;
    state.hasExceededElasticLimit = false;
    state.hasReturnedToZeroAfterPlastic = false;

    dom.forceSlider.value = 0;
    dom.forceValDisplay.textContent = '0 N';
    dom.sliderForceReadout.textContent = '0 N';
    
    dom.steelWire.style.height = `${state.baseWireLength}px`;
    dom.steelWire.style.width = `4px`;

    setFluxText("Naya experiment, nayi discovery! Wapas initial state se start karte hain.", "excited");
}

// PROGRESSION & GRADUATION SYSTEM
function upgradeRank(rankIdx) {
    state.currentRankIndex = rankIdx;
    updateRankUI();
}

function updateRankUI() {
    const currentRank = state.ranks[state.currentRankIndex];
    dom.rankDisplay.textContent = currentRank;
    dom.certRank.textContent = currentRank;
    
    // CSS Class update
    dom.rankDisplay.className = `rank-badge rank-${currentRank.toLowerCase()}`;
}

function finishExperiment() {
    if (state.currentRankIndex < 2) {
        upgradeRank(2); // Auto-promote to Researcher on completion
    }
    dom.certModal.classList.add('active');
}