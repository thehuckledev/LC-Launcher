import "./AddServer.css";

import { useState } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import { showToast } from "../components/Toast.jsx";
import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function AddServerMenu({ setMenu, instance }) {
    const Manager = useManager();
    const [processing, setProcessing] = useState(false);
    
    const [form, setForm] = useState({
        name: "",
        ip: "",
        port: "25565"
    });

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAdd = async () => {
        if (!form.name.trim() || !form.ip.trim()) return showToast("Name and IP Address are required");
        if (!instance?.id) return showToast("No active instance selected");

        setProcessing(true);
        try {
            await Manager.servers.add(
                instance.id,
                form.name.trim(),
                form.ip.trim(),
                form.port.trim() || "25565"
            );
            showToast("Server Added");
            setMenu("servers");
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to save server");
        } finally {
            setProcessing(false);
        };
    };

    return (
        <>
            <div id="top-bar">
                <h1 id="add-server-title">Add Server - {instance?.name || "Unknown"}</h1>
                <div id="main-actions">
                    <Button onclick={() => setMenu("servers")}>
                        <img src={closeIcon} />
                    </Button>
                </div>
            </div>

            <div id="add-server">
                <Textbox 
                    id="server-name"
                    label="Server Name"
                    placeholder="Enter server name..."
                    value={form.name}
                    onchange={(val) => updateField("name", val)}
                    maxlength={25}
                />

                <Textbox 
                    id="server-ip"
                    label="Server Address (IP / Domain)"
                    placeholder="lce.example.net"
                    value={form.ip}
                    onchange={(val) => updateField("ip", val)}
                    maxlength={50}
                />

                <Textbox 
                    id="server-port"
                    label="Port"
                    placeholder="25565"
                    value={form.port}
                    onchange={(val) => updateField("port", val)}
                    maxlength={5}
                />
            </div>

            <div id="add-server-action-bar">
                <Button type="destructive" disabled={processing} onclick={() => setMenu("servers")}>
                    Cancel
                </Button>
                <Button disabled={processing} onclick={handleAdd}>
                    Add
                </Button>
            </div>
        </>
    );
}