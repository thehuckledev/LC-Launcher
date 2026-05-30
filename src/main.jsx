import { render } from "preact";
import App from "./App.jsx";

import { SettingsProvider } from "./utils/SettingsStore.jsx";
import { ManagerProvider } from "./utils/ManagerProvider.jsx";
import lcLib from "./lib/main.js";

window.lib = new lcLib(true);

render(
    <ManagerProvider>
        <SettingsProvider>
            <App />
        </SettingsProvider>
    </ManagerProvider>,
document.getElementById("app"));