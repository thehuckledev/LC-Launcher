import "./Main.css";

import Button from "../components/Button.jsx";

import accountIcon from "../assets/icons/account.png";
import instanceIcon from "../assets/icons/instance.png";
import newsIcon from "../assets/buttons/news.svg";
import optionsIcon from "../assets/buttons/options.svg";
import minecraftLogo from "../assets/minecraftlogo.png";
import discoverIcon from "../assets/buttons/discover.svg";
import serversIcon from "../assets/buttons/servers.svg";

export default function MainMenu({ setMenu }) {
    return (
        <>
            <div id="top-bar">
                <div id="accounts">
                    <img id="account-icon" src={accountIcon} draggable={false} />
                    <div id="account-details">
                        <h1>TheHuckle</h1>
                        <h2>Offline Account</h2>
                    </div>
                </div>
                <div id="main-actions">
                    <Button id="news-button">
                        <img src={newsIcon} draggable={false} />
                    </Button>
                    <Button id="options-button" onclick={() => setMenu('options')}>
                        <img src={optionsIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="bottom-bar">
                <img id="main-logo" src={minecraftLogo} draggable={false} />
                <div id="launch-options-bar">
                    <div id="instances">
                        <img id="instance-icon" src={instanceIcon} draggable={false} />
                        <div id="instance-details">
                            <h1>Nightly</h1>
                            <h2>1.10.7</h2>
                        </div>
                    </div>
                    <div id="main-actions">
                        <Button id="discover-button">
                            <img src={discoverIcon} draggable={false} />
                        </Button>
                        <Button id="play-button">
                            Play
                        </Button>
                        <Button id="servers-button">
                            <img src={serversIcon} draggable={false} />
                        </Button>
                    </div>
                    <div id="stats">
                        <h1>Playtime</h1>
                        <h2>32d 1h 30m</h2>
                    </div>
                </div>
            </div>
        </>
    );
};