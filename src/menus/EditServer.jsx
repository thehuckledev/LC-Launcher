import "./EditServer.css";

import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import { showToast } from "../components/Toast.jsx";
import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function EditServerMenu({ setMenu, instance, server }) {
    const Manager = useManager();
    const [processing, setProcessing] = useState(false);
    
    const [form, setForm] = useState({
        name: "",
        ip: "",
        port: "25565"
    });

    useEffect(() => {
        setForm({
            name: server?.name || "",
            ip: server?.ip || "",
            port: server?.port || "25565"
        });
    }, [server]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = async () => {
        setProcessing(true);
        try {
            const res = await Manager.servers.export(instance.id, server.id);
            if(res === true) showToast("Exported successfully");
        } catch(e) {
            showToast("Export failed");
            console.error(e);
        } finally {
            setProcessing(false);
        };
    };

    const handleSave = async () => {
        if (!form?.name?.trim() || !form?.ip?.trim()) return showToast("Name and IP Address are required");
        if (!instance?.id) return showToast("No active instance selected");
        if (!server?.id) return showToast("No server selected to edit");

        setProcessing(true);
        try {
            await Manager.servers.update(
                instance.id,
                server.id,
                {
                    name: form.name.trim(),
                    ip: form.ip.trim(),
                    port: form.port.trim() || "25565"
                }
            );
            showToast("Server Updated");
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
                <h1 id="edit-server-title">Edit Server - {instance?.name || "Unknown"}</h1>
                <div id="main-actions">
                    <Button onclick={() => setMenu("servers")}>
                        <img src={closeIcon} />
                    </Button>
                </div>
            </div>

            <div id="edit-server">
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

            <div id="edit-server-action-bar">
                <Button type="destructive" disabled={processing} pushable={!processing} onclick={() => setMenu("servers")}>
                    Cancel
                </Button>
                <div id="server-action-bar-group">
                    <Button disabled={processing} pushable={!processing} onclick={handleExport}>
                        Export
                    </Button>
                    <Button disabled={processing} pushable={!processing} onclick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
        </>
    );
}