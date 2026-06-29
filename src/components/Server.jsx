import "./Server.css";

import { useState } from "preact/hooks";

import Button from "./Button.jsx";

import editIcon from "../assets/buttons/edit.svg";
import deleteIcon from "../assets/buttons/delete.svg";

export default function Server({ server, isFeatured, onJoin, onEdit, onDelete }) {
    const { name, ip, port } = server;

    return (
        <div className="mc-server">
            {isFeatured &&
                <div className="mc-server-featured-icon">
                    ★
                </div>
            }
            <div className="mc-server-details">
                <h2 className="mc-server-name">{name}</h2>
                <span className="mc-server-address">{ip}{port !== "25565" ? `:${port}` : ""}</span>
            </div>

            <div className="mc-server-actions">
                <Button id="mc-server-join-btn" onclick={() => onJoin(server)}>
                    Join
                </Button>
                {!isFeatured &&
                    <>
                        <Button
                            id="mc-server-edit-btn"
                            onclick={(e) => {
                                onEdit(server.id);
                            }}
                        >
                            <img src={editIcon} draggable={false} />
                        </Button>
                        <Button
                            id="mc-server-delete-btn"
                            type="destructive"
                            onclick={(e) => {
                                onDelete(server.id);
                            }}
                        >
                            <img src={deleteIcon} draggable={false} />
                        </Button>
                    </>
                }
            </div>
        </div>
    );
};