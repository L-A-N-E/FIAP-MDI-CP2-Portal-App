import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

const SESSION_KEY = "@fiap_session";
const USERS_KEY = "@fiap_users";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

    useEffect(() => {
        async function loadSession() {
            try {
                const json = await AsyncStorage.getItem(SESSION_KEY);
                if (json) {
                    setUser(JSON.parse(json));
                }
            } catch (e) {
                console.warn("Erro ao carregar sessão:", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadSession();
    }, []);

    async function getAllUsers() {
        const { mockUsers } = await import("../data/users.data");
        let appUsers = [];
        try {
            const json = await AsyncStorage.getItem(USERS_KEY);
            if (json) appUsers = JSON.parse(json);
        } catch (_) {}
        return [...mockUsers, ...appUsers];
    }

    async function getAllStudents() {
        const users = await getAllUsers();
        return users.filter((u) => u.role === "student");
    }

    async function login(email, senha) {
        const users = await getAllUsers();
        const found = users.find(
            (u) =>
                u.email.toLowerCase() === email.toLowerCase() &&
                u.senha === senha,
        );
        if (!found) {
            throw new Error("E-mail ou senha incorretos.");
        }
        const { senha: _, ...safeUser } = found;
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
    }

    async function cadastrar(dados) {
        const users = await getAllUsers();
        const existe = users.find(
            (u) => u.email.toLowerCase() === dados.email.toLowerCase(),
        );
        if (existe) {
            throw new Error("Este e-mail já está cadastrado.");
        }

        let appUsers = [];
        try {
            const json = await AsyncStorage.getItem(USERS_KEY);
            if (json) appUsers = JSON.parse(json);
        } catch (_) {}

        appUsers.push(dados);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(appUsers));

        const { senha: _, ...safeUser } = dados;
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
        setNeedsProfileCompletion(true);
    }

    async function completarPerfil(dadosAcademicos) {
        const updatedUser = { ...user, ...dadosAcademicos };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));

        try {
            const json = await AsyncStorage.getItem(USERS_KEY);
            if (json) {
                const appUsers = JSON.parse(json);
                const idx = appUsers.findIndex(
                    (u) =>
                        u.email.toLowerCase() ===
                        updatedUser.email.toLowerCase(),
                );
                if (idx !== -1) {
                    appUsers[idx] = { ...appUsers[idx], ...dadosAcademicos };
                    await AsyncStorage.setItem(
                        USERS_KEY,
                        JSON.stringify(appUsers),
                    );
                }
            }
        } catch (_) {}

        setUser(updatedUser);
        setNeedsProfileCompletion(false);
    }

    async function logout() {
        try {
            await AsyncStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.warn("Erro ao fazer logout:", e);
        }
        setUser(null);
        setNeedsProfileCompletion(false);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                needsProfileCompletion,
                login,
                cadastrar,
                completarPerfil,
                logout,
                getAllStudents,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    return ctx;
}
