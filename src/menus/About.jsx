import "./About.css";

import { useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";
import logo from "../assets/logo.png";

export default function AboutMenu({ setMenu }) {
    return (
        <>
            <div id="top-bar">
                <div></div>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="info">
                <img id="logo" src={logo} draggable="false" />

                <div id="infobar">
                    <a class="link" onclick={() => Neutralino.os.open("https://git.huckle.dev/TheHuckle/LegacyCommunityLauncher/releases/")} tabindex="-1">Releases</a>
                    <a id="version">Version {NL_APPVERSION || "Unknown"}</a>
                    <a class="link" onclick={() => Neutralino.os.open("https://git.huckle.dev/TheHuckle/LegacyCommunityLauncher/")} tabindex="-1">Git
                        Repo</a>
                </div>

                <p id="description">
                    Multi-platform launcher for Minecraft Legacy Console Edition forks.
                </p>

                <p id="creators">
                    Created by
                    <a onclick={() => Neutralino.os.open("https://huckle.dev/")} tabindex="-1">TheHuckle</a>
                </p>
            </div>

            <div id="meta">
                <div class="meta-row">
                    <span class="label">Platform</span>
                    <span id="platform">{NL_OS || "Unknown"} ({NL_ARCH || "Unknown"})</span>
                </div>

                <div class="meta-row">
                    <span class="label">NeuralinoJS Client</span>
                    <span id="njs-client">{NL_CVERSION || "Unknown"} ({NL_CCOMMIT || "Unknown"})</span>
                </div>

                <div class="meta-row">
                    <span class="label">NeuralinoJS Server</span>
                    <span id="njs-server">{NL_VERSION || "Unknown"} ({NL_COMMIT || "Unknown"})</span>
                </div>

                <div class="meta-row">
                    <span class="label">License</span>
                    <span>GPL-3.0-only</span>
                </div>
            </div>
        </>
    );
};