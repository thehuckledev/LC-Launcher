import "./CreateInstance.css";

import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import { showToast } from "../components/Toast.jsx";
import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Select from "../components/Select.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function CreateInstanceMenu({ setMenu, setInstance, reloadData }) {
    const Manager = useManager();

    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [availableTags, setAvailableTags] = useState([]);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [backgroundMode, setBackgroundMode] = useState("SINGLE");
    
    const [form, setForm] = useState({
        name: "",
        icon: "",
        logo: "",
        background: "",
        repo: "",
        tag: "",
        exec: "Minecraft.Client.exe",
        target: "",
        serviceType: "GITHUB",
        serviceDomain: "github.com",
        compatibilityLayer: "DIRECT"
    });

    useEffect(() => {
        const parts = form.repo.split('/');
        if (parts.length < 2 || !parts[0] || !parts[1]) return setAvailableTags([]);

        const fetchRepoData = async () => {
            try {
                const releases = await Manager.remotes.list({
                    serviceType: form.serviceType,
                    serviceDomain: form.serviceDomain,
                    repo: form.repo
                });
                
                const tags = releases.map(r => ({ label: r.tag_name, value: r.tag_name, assets: r.assets }))
                setAvailableTags(tags);
                
                if (tags.length > 0 && !form.tag) {
                    const nightlyTag = tags.find(t => t.value.toLowerCase() == "nightly");
                    if (nightlyTag) updateForm('tag', nightlyTag.value);
                    else updateForm('tag', tags[0].value);
                };
            } catch (e) {
                console.error("Failed to fetch repo data", e);
                setAvailableTags([]);
                setAvailableAssets([]);
                updateForm('tag', '');
                updateForm('target', '');
            };
        };

        const timeoutId = setTimeout(fetchRepoData, 100);
        return () => clearTimeout(timeoutId);
    }, [form.repo, form.serviceType, form.serviceDomain]);

    useEffect(() => {
        const selectedRelease = availableTags.find(t => t.value === form.tag);
        if (selectedRelease?.assets) {
            const assets = selectedRelease.assets.map(a => ({ label: a.name, value: a.name }));
            const filteredAssets = assets.filter(e => {
                const name = e.value.toLowerCase();
                return name.endsWith(".zip") || name.endsWith(".tar.gz") || name.endsWith(".tar.xz");
            });
            setAvailableAssets(filteredAssets);

            if (filteredAssets.length > 0) updateForm('target', filteredAssets[0].value);
        } else {
            setAvailableAssets([]);
        };
    }, [form.tag, availableTags]);

    const updatePanorama = (index, value) => {
        setForm(prev => {
            const currentBackground = Array.isArray(prev.background) 
                ? [...prev.background] 
                : ["", "", "", "", "", ""];
            
            currentBackground[index] = value;
            return { ...prev, background: currentBackground };
        });
    };

    const updateForm = (key, val) => {
        setForm(prev => {
            const mod = { ...prev, [key]: val };

            if (mod.name && mod.repo && mod.tag && mod.exec && mod.target) setReady(true);
            else setReady(false);

            return mod;
        });
    };

    const handleCreate = async () => {
        setProcessing(true);
        try {
            const tempForm = form;

            if (tempForm.serviceType === "CODEBERG") tempForm.serviceType = "GITEA";
            if (tempForm.icon?.trim() === "") tempForm.icon = null;
            if (tempForm.logo?.trim() === "") tempForm.logo = null;

            if (Array.isArray(tempForm.background)) {
                tempForm.background = tempForm.background.map(uri => uri?.trim() || null);
                if (tempForm.background.every(item => item === null)) tempForm.background = null;
            } else tempForm.background = tempForm.background?.trim() || null;

            const newInst = await Manager.instances.create(crypto.randomUUID(), tempForm);
            await reloadData();
            setInstance(newInst);
            setMenu('main');
        } catch (err) {
            showToast("Error: " + err.message);
        } finally {
            setProcessing(false);
        };
    };

    return (
        <>
            <div id="top-bar">
                <h1>Create Instance</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>

            <div id="create-instance">
                <div className="instance-section">
                    <h3>General</h3>
                    <Textbox
                        label="Instance Name"
                        value={form.name}
                        onchange={(v) => updateForm('name', v)}
                        placeholder="My Instance"
                    />
                    <Textbox
                        label="Executable"
                        value={form.exec}
                        onchange={(v) => updateForm('exec', v)}
                        placeholder="Minecraft.Client.exe"
                    />
                    <Select
                        label="Compatibility Layer"
                        value={form.compatibilityLayer}
                        options={[
                            { label: "None (Direct)", value: "DIRECT" },
                            { label: "Runtime", value: "RUNTIME" },
                            { label: "Wine64", value: "WINE64" },
                            { label: "Wine", value: "WINE" },
                            { label: "Proton", value: "PROTON" }
                        ]}
                        onChange={(val) => updateForm('compatibilityLayer', val)}
                    />
                </div>

                <div className="instance-section">
                    <h3>Repository</h3>
                    <Select 
                        label="Service Type"
                        value={form.serviceType}
                        options={[
                            { label: "GitHub", value: "GITHUB" },
                            { label: "GitLab", value: "GITLAB" },
                            { label: "Gitea / Forgejo", value: "GITEA" },
                            { label: "Codeberg", value: "CODEBERG" }
                        ]}
                        onChange={(val) => {
                            let domain = "";
                            if (val === "GITHUB") domain = "github.com";
                            if (val === "GITLAB") domain = "gitlab.com";
                            if (val === "CODEBERG") domain = "codeberg.org";

                            setForm(prev => ({ ...prev, serviceType: val, serviceDomain: domain }));
                        }}
                    />
                    {(form.serviceType === "GITEA") && (
                        <Textbox 
                            label="Service Domain" 
                            value={form.serviceDomain} 
                            onchange={(v) => updateForm('serviceDomain', v)} 
                            placeholder="gitea.com" 
                        />
                    )}
                    <Textbox
                        label="Repository (User/Repo)"
                        value={form.repo}
                        onchange={(v) => updateForm('repo', v)}
                        placeholder="pieeebot/neoLegacy"
                    />
                    <Select 
                        label="Release Tag"
                        value={form.tag}
                        options={availableTags}
                        onChange={(val) => updateForm('tag', val)}
                        disabled={availableTags.length === 0}
                    />

                    <Select 
                        label="Release Asset (.zip / .tar)"
                        value={form.target}
                        options={availableAssets}
                        onChange={(val) => updateForm('target', val)}
                        disabled={availableAssets.length === 0}
                    />
                </div>
                
                <div className="instance-section">
                    <h3>Assets</h3>
                    <Textbox
                        label="Icon Data URI"
                        value={form.icon}
                        onchange={(v) => updateForm('icon', v)}
                        maxlength={99999}
                        placeholder="data:image/png;base64..."
                    />
                    <Textbox
                        label="Logo Data URI"
                        value={form.logo}
                        onchange={(v) => updateForm('logo', v)}
                        maxlength={99999}
                        placeholder="data:image/png;base64..."
                    />
                    <Select
                        label="Background Mode"
                        value={backgroundMode}
                        options={[
                            { label: "Single Image", value: "SINGLE" },
                            { label: "Panorama (6 Images)", value: "PANORAMA" }
                        ]}
                        onChange={(val) => {
                            setBackgroundMode(val);
                            updateForm('background', val === "PANORAMA" ? ["", "", "", "", "", ""] : "");
                        }}
                    />
                    {backgroundMode === "SINGLE" ? (
                        <Textbox
                            label="Background Data URI"
                            value={form.background}
                            onchange={(v) => updateForm('background', v)}
                            maxlength={99999}
                            placeholder="data:image/png;base64..."
                        />
                    ) : (
                        <>
                            {["Front (0)", "Right  (1)", "Back (2)", "Left (3)", "Up (4)", "Down (5)"].map((label, i) => (
                                <Textbox
                                    key={i}
                                    label={`Panorama ${label} Data URI`}
                                    value={Array.isArray(form.background) ? form.background[i] : ""}
                                    onchange={(v) => updatePanorama(i, v)}
                                    maxlength={99999}
                                    placeholder="data:image/png;base64..."
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div id="create-instance-action-bar">
                <div></div>
                <Button disabled={processing || !ready} pushable={!processing && ready} onclick={handleCreate}>
                    Create
                </Button>
            </div>
        </>
    );
};