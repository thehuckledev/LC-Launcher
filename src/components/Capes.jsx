import "./Capes.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "./Toast.jsx";

import clickSfx from "../assets/sfx/press.flac";

const sound = new Audio(clickSfx);
sound.preload = "auto";

export default function Capes({ setShowCapeMenu, cape, setCape, profile }) {
    const Manager = useManager();

    const [capePresets, setCapePresets] = useState([]);
    const { settings } = useSettings();

    const playClick = () => {
        if (!settings.buttonClickSFX) return;

        const click = sound.cloneNode();
        click.volume = (settings?.volume ?? 100) / 100;
        click.play().catch(err => console.error("Capes sfx failed:", err));
    };

    useEffect(() => loadCapes(), [profile]);

    const loadCapes = async () => {
        try {
            const list = await Manager.capes.list();
            setCapePresets(list || []);
        } catch (e) {
            console.error("Failed to load capes", e);
        };
    };

    const handleSelectCape = (selectedCape) => {
        playClick();
        setCape(selectedCape);
        setShowCapeMenu(false);
        showToast(selectedCape ? "Cape selected" : "Cape removed");
    };

    const handleCustomCape = async () => {
        try {
            const res = await Neutralino.os.showOpenDialog(
                "Select a Cape",
                {
                    multiSelections: false,
                    filters: [{ name: 'Images', extensions: ['png'] }]
                }
            );
            if (!res || res.length === 0) return;
            const src = res[0].trim();
            if (!src.endsWith(".png")) return showToast("Please select a valid png file"); // extra check as sometimes a file explorer bypasses filter
            
            if (!(await testPath(src))) return showToast("Couldn't find cape from path");

            const file = await Neutralino.filesystem.readBinaryFile(src);
            const base64String = btoa(
                new Uint8Array(file)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
    
            let mimeType = 'image/png';
            if (src.endsWith('.jpg') || src.endsWith('.jpeg'))
                mimeType = 'image/jpeg';
            
            const capeDataURI = `data:${mimeType};base64,${base64String}`;

            setCape(capeDataURI);
            setShowCapeMenu(false);
            showToast("Custom cape selected");
        } catch (err) {
            console.error(err);
            showToast("Failed to load custom cape");
        };
    };

    async function testPath(path) {
        try {
            await Neutralino.filesystem.getStats(path);
            return true;
        } catch {
            return false;
        };
    };

    return (
        <div id="cape-selection-container">
            <div className="cape-category-section">
                <h3 className="category-title">Options</h3>
                <div className="cape-grid">
                    <div className={`cape-card ${!cape ? "selected" : ""}`} onclick={() => handleSelectCape(null)}>
                        <div className="cape-preview none-preview">None</div>
                        <span>No Cape</span>
                    </div>

                    <div className="cape-card" onclick={handleCustomCape}>
                        <div className="cape-preview custom-preview">+</div>
                        <span>Browse</span>
                    </div>
                </div>
            </div>

            {capePresets.map((group) => (
                <div key={group.category} className="cape-category-section">
                    <h3 className="category-title">{group.category}</h3>
                    <div className="cape-grid">
                        {group.items?.map((c) => (
                            <div
                                key={c.id} 
                                className={`cape-card ${cape === c.path ? "selected" : ""}`}
                                onclick={() => handleSelectCape(c.path)}
                            >
                                <img className="cape-preview" src={c.previewUrl} alt={c.name} />
                                <span>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};