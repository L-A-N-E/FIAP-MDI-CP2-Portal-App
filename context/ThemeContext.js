import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const ThemeContext = createContext(null);

// ─── Paleta de cores ───────────────────────────────────────────────────────────
// O rosa-magenta (#FF0C5C) NUNCA muda entre temas.
export const COLORS = {
    brand: "#FF0C5C",

    light: {
        bg: "#f5f5f5",
        card: "#ffffff",
        cardBorder: "#E7EAF0",
        text: "#171717",
        textSecondary: "#666666",
        textMuted: "#98A2B3",
        textInverse: "#ffffff",
        inputBg: "#ffffff",
        inputBorder: "#dddddd",
        inputBorderError: "#e53935",
        headerBg: "#f4f5f9",
        rowAlt: "#F8FAFC",
        separator: "#d9dbe0",
        tabBg: "#ffffff",
        tabActiveBg: "#FF0C5C",
        badgeBg: "#F8FAFC",
        queueBoxBg: "#f5f5f5",
        secondaryBtn: "#111111",
        statusBar: "dark-content",
        overlay: "rgba(16,24,40,0.35)",
    },
    dark: {
        bg: "#0f0f0f",
        card: "#1c1c1e",
        cardBorder: "#2c2c2e",
        text: "#f2f2f7",
        textSecondary: "#ebebf5",
        textMuted: "#8e8e93",
        textInverse: "#ffffff",
        inputBg: "#2c2c2e",
        inputBorder: "#3a3a3c",
        inputBorderError: "#e53935",
        headerBg: "#27272a",
        rowAlt: "#2c2c2e",
        separator: "#2c2c2e",
        tabBg: "#1c1c1e",
        tabActiveBg: "#FF0C5C",
        badgeBg: "#2c2c2e",
        queueBoxBg: "#2c2c2e",
        secondaryBtn: "#2c2c2e",
        statusBar: "light-content",
        overlay: "rgba(0,0,0,0.6)",
    },
};

function themeKey(email) {
    // SecureStore keys: only alphanumeric + _ + .  (no @ or /)
    const safe = (email ?? "guest").replace(/[^a-zA-Z0-9_.]/g, "_");
    return `fiap_theme_${safe}`;
}

export function ThemeProvider({ children, userEmail }) {
    const [dark, setDark] = useState(false);

    // Carrega preferência do usuário ao montar / trocar de usuário
    useEffect(() => {
        async function load() {
            if (!userEmail) return;
            try {
                const saved = await SecureStore.getItemAsync(themeKey(userEmail));
                setDark(saved === "dark");
            } catch (_) {}
        }
        load();
    }, [userEmail]);

    const toggleTheme = useCallback(async () => {
        const next = !dark;
        setDark(next);
        if (userEmail) {
            try {
                await SecureStore.setItemAsync(themeKey(userEmail), next ? "dark" : "light");
            } catch (_) {}
        }
    }, [dark, userEmail]);

    const colors = dark ? COLORS.dark : COLORS.light;

    return (
        <ThemeContext.Provider value={{ dark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
    return ctx;
}
