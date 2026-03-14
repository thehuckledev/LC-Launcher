import { render } from "preact";
import Neutralino from "@neutralinojs/lib";
import App from "./App.jsx";

import { SettingsProvider } from "./utils/SettingsStore.jsx";

Neutralino.init();

render(
    <SettingsProvider>
        <App />
    </SettingsProvider>,
document.getElementById("app"));