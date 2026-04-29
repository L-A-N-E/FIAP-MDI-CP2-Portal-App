import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayout() {
    const { user, isLoading, needsProfileCompletion } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inCompletarPerfil = segments[1] === "complete_profile";

        if (!user && !inAuthGroup) {
            // Não logado fora da área de auth → login
            router.replace("/(auth)/login");
        } else if (user && needsProfileCompletion && !inCompletarPerfil) {
            // Cadastrou mas ainda não completou o perfil → completar-perfil
            router.replace("/(auth)/complete_profile");
        } else if (user && !needsProfileCompletion && inAuthGroup) {
            // Logado e perfil completo ainda em auth → tabs
            router.replace("/(tabs)/");
        }
    }, [user, isLoading, needsProfileCompletion, segments]);

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color="#FF0C5C" />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
    return (
        <AuthProvider>
            <RootLayout />
        </AuthProvider>
    );
}
