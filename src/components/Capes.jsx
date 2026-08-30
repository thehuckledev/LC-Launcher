import "./Capes.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "./Toast.jsx";

import clickSfx from "../assets/sfx/press.flac";

const sound = new Audio(clickSfx);
sound.preload = "auto";

export default function Capes({ setShowCapeMenu, cape, setCape, capeHistory, setCapeHistory, profile }) {
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

    const createCapePreview = (imageSrc) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;

                if (width <= 0 || height <= 0 || width / height !== 2) return resolve(null);

                const scale = width / 64;

                const sourceX = 1 * scale;
                const sourceY = 1 * scale;
                const sourceWidth = 10 * scale;
                const sourceHeight = 16 * scale;

                const canvas = document.createElement("canvas");
                canvas.width = 100;
                canvas.height = 160;

                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => resolve(null);
            img.src = imageSrc;
        });
    };

    const handleSelectCape = (selectedCape) => {
        playClick();

        if (!selectedCape) {
            setCape(null);
            setShowCapeMenu(false);
            return showToast("Cape removed");
        };

        if (selectedCape.path === cape) return;

        const updatedHistory = [
            selectedCape,
            ...capeHistory.filter(item => item.path !== selectedCape.path && item.id !== selectedCape.id)
        ].slice(0, 6);

        setCape(selectedCape.path);
        setCapeHistory(updatedHistory);
        setShowCapeMenu(false);
        showToast("Cape selected");
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

            const capeFilename = src.split(/[/\\]/).pop();
            const strippedFileName = capeFilename.substring(0, capeFilename.lastIndexOf('.')) || capeFilename;

            const capeName = strippedFileName;
            const capeId = strippedFileName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

            const file = await Neutralino.filesystem.readBinaryFile(src);
            const base64String = btoa(
                new Uint8Array(file)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            let mimeType = 'image/png';
            if (src.endsWith('.jpg') || src.endsWith('.jpeg'))
                mimeType = 'image/jpeg';

            const capeDataURI = `data:${mimeType};base64,${base64String}`;

            if (capeDataURI === cape) return;

            const isValidSize = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const { width, height } = img;
                    const isDefault = width === 64 && height === 32;
                    const isCorrectRatio = width > 0 && height > 0 && (width / height === 2);

                    resolve(isDefault || isCorrectRatio);
                };
                img.onerror = () => resolve(false);
                img.src = capeDataURI;
            });

            if (!isValidSize) return showToast("Invalid cape asset size");

            const capePreview = await createCapePreview(capeDataURI);

            const customCape = {
                id: capeId,
                name: capeName,
                path: capeDataURI,
                previewUrl: capePreview
            };

            const updatedHistory = [
                customCape,
                ...capeHistory.filter(item => item.path !== capeDataURI && item.id !== capeId)
            ].slice(0, 6);

            setCape(capeDataURI);
            setCapeHistory(updatedHistory);
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

            {(capeHistory && Array.isArray(capeHistory) && capeHistory.length > 0) &&
                <div className="cape-category-section">
                    <h3 className="category-title">History</h3>
                    <div className="cape-grid">
                        {capeHistory.map((c) => (
                            <div
                                key={c.id}
                                className={`cape-card ${cape === c.path ? "selected" : ""}`}
                                onclick={() => handleSelectCape(c)}
                            >
                                <img className="cape-preview" src={c.previewUrl} alt={c.name} />
                                <span>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            }

            {capePresets.map((group) => (
                <div key={group.category} className="cape-category-section">
                    <h3 className="category-title">{group.category}</h3>
                    <div className="cape-grid">
                        {group.items?.map((c) => (
                            <div
                                key={c.id}
                                className="cape-card"
                                onclick={() => handleSelectCape(c)}
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