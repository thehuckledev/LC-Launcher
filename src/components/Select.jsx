import "./Select.css";

import { useState, useEffect, useRef } from "preact/hooks";

export default function Select({ id, label, value, options = [], onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    return (
        <div className="mc-select-wrapper" id={id} ref={containerRef}>
            {label && <label className="mc-select-label">{label}</label>}
            
            <div 
                className={`mc-select-btn ${isOpen ? "is-open" : ""}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption?.label || value}</span>
                <div className="mc-select-arrow" />
            </div>

            {(shouldRender && options.length > 0) && (
                <div 
                    className={`mc-select-menu ${isOpen ? "menu-open" : "menu-close"}`}
                    onAnimationEnd={handleAnimationEnd}
                >
                    {options.map((opt) => (
                        <div 
                            key={opt.value} 
                            className={`mc-select-option ${value === opt.value ? "selected" : ""}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};