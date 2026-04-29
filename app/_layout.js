import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

function RootLayout() {
    const { user, isLoading, needsProfileCompletion } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inCompletarPerfil = segments[1] === "complete_profile";

        if (!user && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (user && needsProfileCompletion && !inCompletarPerfil) {
            router.replace("/(auth)/complete_profile");
        } else if (user && !needsProfileCompletion && inAuthGroup) {
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

    return (
        <ThemeProvider userEmail={user?.email}>
            <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    );
}

export default function Layout() {
    return (
        <AuthProvider>
            <RootLayout />
        </AuthProvider>
    );
}
