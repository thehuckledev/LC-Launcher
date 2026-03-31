import { showToast } from "../components/Toast.jsx";

const audioCtx = new AudioContext();
const audioElement = new Audio();
audioElement.volume = 1;

const audioFiles = [
    new URL("../assets/music/Snapdragon_-_Therm.opus", import.meta.url).href,
    new URL("../assets/music/Aria_Math_-_C418.opus", import.meta.url).href,
    new URL("../assets/music/Far_-_C418.opus", import.meta.url).href,
    new URL("../assets/music/Kyoto_-_C418.opus", import.meta.url).href,
    new URL("../assets/music/Mutation_-_C418.opus", import.meta.url).href
];

let initialized = false;
let source = null;
let panner = null;
let feedbackNode = null;

let animationId = null;
let angle = 0;

let lastIndex = -1;

async function setupAudio() {
    if (initialized) return;
    initialized = true;

    if (audioCtx.state === "suspended") await audioCtx.resume();

    source = audioCtx.createMediaElementSource(audioElement);

    feedbackNode = audioCtx.createGain();
    feedbackNode.gain.value = 0.5;

    panner = new PannerNode(audioCtx, {
        panningModel: "HRTF",
        distanceModel: "inverse",
        positionX: 0,
        positionY: 0,
        positionZ: 1
    });

    source.connect(feedbackNode);
    feedbackNode.connect(panner);
    panner.connect(audioCtx.destination);
};

function startMovement() {
    if (animationId) return;

    const moveSound = (time) => {
        angle += 0.02;

        const x = Math.sin(angle) * 5;
        const z = Math.cos(angle) * 5;

        panner.positionX.value = x;
        panner.positionZ.value = z;

        animationId = requestAnimationFrame(moveSound);
    };

    animationId = requestAnimationFrame(moveSound);
};

function stopMovement() {
    if (!animationId) return;

    cancelAnimationFrame(animationId);
    animationId = null;
};

function getNextIndex() {
    let index;
    do {
        index = (Math.random() * audioFiles.length) | 0;
    } while (index === lastIndex);

    lastIndex = index;
    return index;
};

async function playSong() {
    await setupAudio();

    const index = getNextIndex();
    const file = audioFiles[index];

    audioElement.src = file;
    await audioElement.play();

    startMovement();
    showToast(`Now playing: ${file.split('/').pop().replace(".opus", "").replaceAll("_", " ")}`);
};

audioElement.addEventListener("ended", () => {
    playSong();
});

export async function startMusic() {
    await playSong();
};

export function stopMusic() {
    audioElement.pause();
    audioElement.currentTime = 0;

    stopMovement();
};

export function setVolume(vol) {
    if (feedbackNode) feedbackNode.gain.value = vol;
};