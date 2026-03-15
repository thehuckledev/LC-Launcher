import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

import { Manager } from "../manager/main.js";

const ManagerContext = createContext();

export function ManagerProvider({ children }) {
    const [manager] = useState(() => new Manager());

    return (
        <ManagerContext.Provider value={manager}>
            {children}
        </ManagerContext.Provider>
    );
};

export function useManager() {
    return useContext(ManagerContext);
};