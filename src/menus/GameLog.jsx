import "./GameLog.css";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";
// TODO add filter by type info, error etc. also add searchbox
export default function GameLogMenu({ setMenu, logs }) { // TODO add line numbers and parse stdErr when using wine to parse info error from the actual msg
    return (
        <>
            <div id="top-bar">
                <h1>Game Log</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="game-log">
                {logs.map((log, i) => (
                    <div key={i} class={`log-entry ${log.type}`}>
                        <span className="line-number">{i + 1}</span>
                        <span className="log-message">{log.message}</span>
                    </div>
                ))}
            </div>
        </>
    );
};