import * as Neutralino from "./vendor/neutralino/neutralino.mjs";

Neutralino.init();

await Neutralino.window.setDraggableRegion('window-title');

(async() => {
    if (NL_OS !== 'Darwin') return;

    const menu = [
        {
            id: 'app', text: 'LC Launcher',
            menuItems: [
                { id: 'about', text: 'About LC Launcher' },
                { id: 'quit', text: 'Quit LC Launcher', shortcut: 'Q' },
            ]
        }
    ];

    await Neutralino.window.setMainMenu(menu);
    await Neutralino.events.on('mainMenuItemClicked', async (evt) => {
        if (evt.detail.id == "quit") await Neutralino.app.exit();
    });
    console.log("Set Main Menu");
})();

(async() => {
    // Debug Mode right click for inspect element
    // Shift + 1 to allow right click
    let isDebugOn = false;
    let debugKey = "Digit1";
    window.addEventListener("keydown", function(e) {
        if (e.shiftKey && e.code === debugKey && isDebugOn === false) {
            (async () => {
                await Neutralino.os.showNotification('Debug Mode', 'You have enabled debug mode until you restart LC Launcher', 'WARNING');
                isDebugOn = true;
            })();
        };
    });
    window.addEventListener("contextmenu", function(e) {
        if (!isDebugOn) e.preventDefault();
    }, false);
    console.log("Listening for Debug Keybind");

    // stop annoying scroll bounce
    function hasScrollableParent(e) {
        return e.composedPath().some(el => {
            if (!(el instanceof HTMLElement)) return false;

            const style = getComputedStyle(el);
            const overflowY = style.overflowY;

            return (
                (overflowY === 'auto' || overflowY === 'scroll') &&
                el.scrollHeight > el.clientHeight
            );
        });
    };

    window.addEventListener('wheel', (e) => {
        if (!hasScrollableParent(e)) e.preventDefault();
    }, { passive: false });
})();

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

    /*let delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.2;*/

    let feedbackNode = audioCtx.createGain();
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

await setupSurround();
audioElement.play();

setTimeout(() => {
    document.querySelector("#main").classList.remove("open-anim");
}, 2000);