import { useState, useEffect, useRef } from "preact/hooks";
import "./Dropdown.css";
import Button from "./Button.jsx";
import editIcon from "../assets/buttons/options.svg"; 

export default function Dropdown({ id, selected, items = [], onSelect, onEdit, onCreate, direction = "down", roundedIcon = true }) {
    const [shouldRender, setShouldRender] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    return (
        <div id={id} className={`mc-dropdown ${isOpen ? "is-open" : ""}`} ref={dropdownRef}>
            <div className="dropdown-btn" onClick={() => setIsOpen(!isOpen)}>
                <img className={`entry-icon ${roundedIcon ? "rounded-icon" : ""}`} src={selected?.icon} draggable={false} />
                <div className="entry-details">
                    <h1>{selected?.line1 || "No Profile"}</h1>
                    <h2>{selected?.line2 || "N/A"}</h2>
                </div>
            </div>

            {shouldRender && (
                <div className={`dropdown-menu ${direction} ${isOpen ? "dropdown-menu-open" : "dropdown-menu-close"}`} onAnimationEnd={handleAnimationEnd} >
                    {items.map((item) => (
                        <div className="dropdown-row" key={item.id}>
                            <div className="dropdown-row-content" onClick={() => {
                                onSelect(item);
                                setIsOpen(false);
                            }}>
                                <img className={`entry-icon ${roundedIcon ? "rounded-icon" : ""}`} src={item?.icon} draggable={false} />
                                <div className="entry-details">
                                    <h1>{item?.line1 || "No Profile"}</h1>
                                    <h2>{item?.line2 || "N/A"}</h2>
                                </div>
                            </div>
                            {onEdit && (
                                <Button id="dropdown-edit-btn" pushable={true} onclick={() => onEdit(item)}>
                                    <img src={editIcon} draggable={false} />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button id="dropdown-add-btn" pushable={true} onclick={() => onCreate()}>
                        Create new
                    </Button>
                </div>
            )}
        </div>
    );
};