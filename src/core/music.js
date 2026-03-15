import { showToast } from "../components/Toast.jsx";

import "../assets/music/Aria_Math_-_C418.mp3";
import "../assets/music/Far_-_C418.mp3";
import "../assets/music/Kyoto_-_C418.mp3";
import "../assets/music/Mutation_-_C418.mp3";
import "../assets/music/Snapdragon_-_Therm.mp3";

const audioCtx = new AudioContext();
const audioFiles = [
    'Snapdragon_-_Therm.mp3',
    'Aria_Math_-_C418.mp3',
    'Far_-_C418.mp3',
    'Kyoto_-_C418.mp3',
    'Mutation_-_C418.mp3'
]; 

const audioElement = new Audio(); 
audioElement.volume = 1;

let feedbackNode;
async function setupSurround() {
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    };

    let source = audioCtx.createMediaElementSource(audioElement);

    const panner = new PannerNode(audioCtx, {
        panningModel: 'HRTF',
        distanceModel: 'inverse',
        positionX: 0,
        positionY: 0,
        positionZ: 1,
        orientationX: 0,
        orientationY: 0,
        orientationZ: -1
    });

    /*let delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.2;*/

    feedbackNode = audioCtx.createGain();
    feedbackNode.gain.value = 0.5;

    //source.connect(delayNode);
    //delayNode.connect(feedbackNode);
    source.connect(feedbackNode)
    //feedbackNode.connect(delayNode);
    
    feedbackNode.connect(panner);
    panner.connect(audioCtx.destination);

    let angle = 0;
    const moveSound = () => {
        angle += 0.02;
        const x = Math.sin(angle) * 5; 
        const z = Math.cos(angle) * 5;
        
        panner.positionX.value = x;
        panner.positionZ.value = z;
        
        requestAnimationFrame(moveSound);
    };
    moveSound();
};
setupSurround();

let lastIndex = -1;
function playSong() {
    let index;
    do {
        index = (Math.random() * audioFiles.length) | 0;
    } while (index === lastIndex);
    lastIndex = index;

    const audioPath = audioFiles[index];
    audioElement.src = `./assets/music/${audioPath}`;
    audioElement.play();

    showToast(`Now playing: ${audioPath.replace(".mp3", "").replaceAll("_", " ")}`);
};
audioElement.addEventListener("ended", () => playSong());

export async function startMusic() {
    playSong();
};

export async function stopMusic() {
    audioElement.pause();
    audioElement.currentTime = 0;
};

export function setVolume(vol) {
    if(feedbackNode) feedbackNode.gain.value = vol;
};