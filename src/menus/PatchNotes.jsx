import "./PatchNotes.css";

import { useEffect, useState } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function PatchNotesMenu({ setMenu, instance }) {
    const Manager = useManager();

    const [patchnotes, setPatchnotes] = useState("");

    useEffect(() => {
        async function load() {
            const notes = await Manager.remotes.patchnotes(instance, instance.tag);
            setPatchnotes(notes);
        };

        load();
    }, []);
    
    return (
        <>
            <div id="top-bar">
                <h1>Release Details</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="patchnotes" style={{display:patchnotes ? "block" : "none"}} dangerouslySetInnerHTML={{__html:patchnotes}}></div>
        </>
    );
};