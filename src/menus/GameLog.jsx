import "./GameLog.css";

import { useRef, useEffect } from "preact/hooks";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";
// TODO add filter by type info, error etc. also add searchbox
export default function GameLogMenu({ setMenu, logs }) { // TODO add line numbers and parse stdErr when using wine to parse info error from the actual msg
    const logRef = useRef();
    const shouldStickRef = useRef(true);

    useEffect(() => {
        const el = logRef.current;
        if (!el) return;

        const handleScroll = () => {
            const isNearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 150;

            shouldStickRef.current = isNearBottom;
        };

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const el = logRef.current;
        if (!el) return;

        if (shouldStickRef.current) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: "instant",
            });
        }
    }, [logs]);

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
            <div id="game-log" ref={logRef}>
                {logs.map((log, i) => (
                    <div key={i} class={`log-entry ${log.type}`}>
                        <span className="line-number">{i + 1}</span>
                        <span className="log-message">[{log.timestamp || "--"}] [{log.type.toUpperCase()}]{log.channel && ` ${log.channel}`}{log.func && `:${log.func}()`} {log.message}</span>
                    </div>
                ))}
            </div>
        </>
    );
};