import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

const SESSION_KEY = '@fiap_session';
const USERS_KEY = '@fiap_users';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // verifica se há sessão salva na inicialização
    useEffect(() => {
        async function loadSession() {
            try {
                const json = await AsyncStorage.getItem(SESSION_KEY);
                if (json) {
                    setUser(JSON.parse(json));
                }
            } catch (e) {
                console.warn('Erro ao carregar sessão:', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadSession();
    }, []);

    // busca usuários (mockados e salvos no AsyncStorage)
    async function getAllUsers() {
        const { mockUsers } = await import('../data/users.data');
        let appUsers = [];
        try {
            const json = await AsyncStorage.getItem(USERS_KEY);
            if (json) appUsers = JSON.parse(json);
        } catch (_) {}
        return [...mockUsers, ...appUsers];
    }

    // valida credenciais e persiste sessão
    async function login(email, senha) {
        const users = await getAllUsers();
        const found = users.find(
            (u) =>
                u.email.toLowerCase() === email.toLowerCase() &&
                u.senha === senha
        );
        if (!found) {
            throw new Error('E-mail ou senha incorretos.');
        }
        const { senha: _, ...safeUser } = found; // não guarda a senha na sessão
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
    }

    // valida unicidade e salva novo usuário
    async function cadastrar(dados) {
        const users = await getAllUsers();
        const existe = users.find(
            (u) => u.email.toLowerCase() === dados.email.toLowerCase()
        );
        if (existe) {
            throw new Error('Este e-mail já está cadastrado.');
        }
        // salva no AsyncStorage
        let appUsers = [];
        try {
            const json = await AsyncStorage.getItem(USERS_KEY);
            if (json) appUsers = JSON.parse(json);
        } catch (_) {}
        appUsers.push(dados);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(appUsers));

        // loga automaticamente após cadastro
        const { senha: _, ...safeUser } = dados;
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
    }

    // limpa sessão e volta ao estado inicial no logout
    async function logout() {
        try {
            await AsyncStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.warn('Erro ao fazer logout:', e);
        }
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, cadastrar, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// hook para consumir o context
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
    return ctx;
}
