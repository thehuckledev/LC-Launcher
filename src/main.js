const audioCtx = new AudioContext();
const audioElement = new Audio('./assets/music/Snapdragon_-_Therm.m4a'); 
audioElement.volume = 1;
audioElement.loop = true;

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

    let delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.2;

    let feedbackNode = audioCtx.createGain();
    feedbackNode.gain.value = 0.5;

    source.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    
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

await setupSurround();
audioElement.play();

setTimeout(() => {
    document.querySelector("#main").classList.remove("open-anim");
}, 2000);