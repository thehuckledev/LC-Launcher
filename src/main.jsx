import { render } from "preact";
import Neutralino from "@neutralinojs/lib";
import App from "./App.jsx";

import { SettingsProvider } from "./utils/SettingsStore.jsx";
import { ManagerProvider } from "./utils/ManagerProvider.jsx";

Neutralino.init();

render(
    <ManagerProvider>
        <SettingsProvider>
            <App />
        </SettingsProvider>
    </ManagerProvider>,
document.getElementById("app"));