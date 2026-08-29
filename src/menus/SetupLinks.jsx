import "./SetupLinks.css";

import Neutralino from "@neutralinojs/lib";

import config from "../data/config.js";
import Button from "../components/Button.jsx";

export default function SetupLinksMenu({ setMenu }) {
    return (
        <>
            <div id="setupLinks">
                <h1 class="moto">Welcome to
                    <div class="slidingVertical">
                        <span>LC Launcher</span>
                        <span>Legacy Community Launcher</span>
                        <span>LCE Launcher</span>
                    </div>
                </h1>
                <h2>Project links, donations are appriciated!</h2>
                <div id="setupLinksContainer">
                    <Button type="donate" onclick={() => Neutralino.os.open(config.donationLink)}>
                        Donate
                    </Button>
                    <Button type="discord" onclick={async() => {
                        for await (const inv of config.discordInvite) {
                            await Neutralino.os.open(inv);
                        };
                    }}>
                        Join the Discord
                    </Button>
                    <Button type="github" onclick={() => Neutralino.os.open(`https://github.com/${config.projectGithubUser}/${config.projectGithubRepo}`)}>
                        Open the Github
                    </Button>
                    <Button type="website" onclick={() => Neutralino.os.open(config.website)}>
                        Open the Website
                    </Button>
                </div>
            </div>
            <div id="setupLinks-action-bar">
                <div></div>
                <Button id="done-button" onclick={() => setMenu('main')}>
                    Done
                </Button>
            </div>
        </>
    );
};