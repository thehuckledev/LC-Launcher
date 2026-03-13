import Neutralino from "@neutralinojs/lib";

import { setupWindow } from "./window/window.js";
import { renderMenu } from "./window/renderMenu.js";
import { startMusic } from "./app/music.js";

Neutralino.init();

setupWindow();

setTimeout(() => document.querySelector("#main").classList.remove("open-anim"), 2000);

setTimeout(() => { // once anim done
    window.renderMenu = renderMenu;
    //startMusic();
}, 1600);