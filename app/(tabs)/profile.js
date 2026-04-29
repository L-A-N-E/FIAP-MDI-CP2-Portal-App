import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

function InfoRow({ label, value, colors }) {
    return (
        <View style={[styles.infoRow, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {label}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
                {value || "—"}
            </Text>
        </View>
    );
}

function photoKey(email) {
    const safe = (email ?? "guest").replace(/[^a-zA-Z0-9_.]/g, "_");
    return `fiap_photo_${safe}`;
}

export default function Profile() {
    const { user, logout } = useAuth();
    const { colors, dark, toggleTheme } = useTheme();
    const isTeacher = user?.role === "teacher";

    const [avatarUri, setAvatarUri] = useState(null);
    const [loadingPhoto, setLoadingPhoto] = useState(true);

    useEffect(() => {
        async function loadPhoto() {
            try {
                const saved = await SecureStore.getItemAsync(
                    photoKey(user?.email),
                );
                if (saved) setAvatarUri(saved);
            } catch (_) {
            } finally {
                setLoadingPhoto(false);
            }
        }
        if (user?.email) loadPhoto();
    }, [user?.email]);

    async function pickImage() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.6,
            });
            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setAvatarUri(uri);
                await SecureStore.setItemAsync(photoKey(user?.email), uri);
            }
        } catch (_) {
            Alert.alert("Erro", "Não foi possível abrir a galeria.");
        }
    }

    const s = makeStyles(colors);

    return (
        <ScrollView style={s.container}>
            <View style={s.header}>
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={s.logo}
                    resizeMode="contain"
                />
                <Text style={s.title}>Meu Perfil</Text>
                {isTeacher && (
                    <View style={s.badgeProfessor}>
                        <Text style={s.badgeTexto}>Professor</Text>
                    </View>
                )}
            </View>

            {/* Avatar */}
            <View style={s.avatarContainer}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    <View style={s.avatarWrapper}>
                        {loadingPhoto ? (
                            <View style={[s.avatar, s.avatarPlaceholder]}>
                                <ActivityIndicator color="#FF0C5C" />
                            </View>
                        ) : avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={s.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[s.avatar, s.avatarPlaceholder]}>
                                <Text style={s.avatarTexto}>
                                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                                </Text>
                            </View>
                        )}
                        <View style={s.cameraIconContainer}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </View>
                </TouchableOpacity>
                <Text style={s.nomeCompleto}>
                    {user?.name} {user?.last_name}
                </Text>
                <Text style={s.emailTexto}>{user?.email}</Text>
            </View>

            {/* Dados */}
            <View style={s.card}>
                <Text style={s.cardTitulo}>
                    {isTeacher ? "Dados Profissionais" : "Dados Acadêmicos"}
                </Text>
                {isTeacher ? (
                    <>
                        <InfoRow label="ID" value={user?.id} colors={colors} />
                        <InfoRow
                            label="Departamento"
                            value={user?.department}
                            colors={colors}
                        />
                        <InfoRow
                            label="Unidade"
                            value={user?.unidade}
                            colors={colors}
                        />
                    </>
                ) : (
                    <>
                        <InfoRow label="RM" value={user?.rm} colors={colors} />
                        <InfoRow
                            label="Curso"
                            value={user?.course}
                            colors={colors}
                        />
                        <InfoRow
                            label="Semestre"
                            value={user?.semester}
                            colors={colors}
                        />
                        <InfoRow
                            label="Turma"
                            value={user?.class}
                            colors={colors}
                        />
                        <InfoRow
                            label="Período"
                            value={user?.period}
                            colors={colors}
                        />
                        <InfoRow
                            label="Unidade"
                            value={user?.unidade}
                            colors={colors}
                        />
                    </>
                )}
            </View>

            {/* Aparência */}
            <View style={s.card}>
                <Text style={s.cardTitulo}>Aparência</Text>
                <View style={s.themeRow}>
                    <View style={s.themeLeft}>
                        <Ionicons
                            name={dark ? "moon" : "sunny"}
                            size={20}
                            color="#FF0C5C"
                            style={{ marginRight: 10 }}
                        />
                        <Text style={s.themeLabel}>Modo escuro</Text>
                    </View>
                    <Switch
                        value={dark}
                        onValueChange={toggleTheme}
                        trackColor={{
                            false: colors.separator,
                            true: "#FF0C5C",
                        }}
                        thumbColor={dark ? "#fff" : "#f4f3f4"}
                    />
                </View>
            </View>

            <View style={s.logoutContainer}>
                <TouchableOpacity
                    style={s.botaoLogout}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Text style={s.botaoLogoutTexto}>Sair da conta</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function makeStyles(c) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.bg },
        header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
        logo: { width: 140, height: 60 },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 4,
            color: c.text,
        },
        badgeProfessor: {
            marginTop: 6,
            backgroundColor: "#FF0C5C",
            paddingHorizontal: 12,
            paddingVertical: 3,
            borderRadius: 20,
        },
        badgeTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
        avatarContainer: { alignItems: "center", marginVertical: 20 },
        avatarWrapper: { position: "relative", marginBottom: 12 },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: "#FF0C5C",
        },
        avatarPlaceholder: {
            backgroundColor: "#FF0C5C",
            alignItems: "center",
            justifyContent: "center",
        },
        avatarTexto: { color: "#fff", fontSize: 36, fontWeight: "bold" },
        cameraIconContainer: {
            position: "absolute",
            bottom: 4,
            right: 4,
            backgroundColor: "#FF0C5C",
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#fff",
        },
        nomeCompleto: { fontSize: 20, fontWeight: "bold", color: c.text },
        emailTexto: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
        card: {
            marginHorizontal: 20,
            backgroundColor: c.card,
            borderRadius: 14,
            padding: 20,
            elevation: 3,
            marginBottom: 16,
        },
        cardTitulo: {
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 16,
            color: "#FF0C5C",
        },
        infoRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 12,
            borderBottomWidth: 1,
        },
        infoLabel: { fontSize: 14 },
        infoValue: { fontSize: 14, fontWeight: "600" },
        themeRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 4,
        },
        themeLeft: { flexDirection: "row", alignItems: "center" },
        themeLabel: { fontSize: 15, color: c.text, fontWeight: "500" },
        logoutContainer: { margin: 20, marginTop: 8 },
        botaoLogout: {
            backgroundColor: "#FF0C5C",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
        },
        botaoLogoutTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    });
}

const styles = StyleSheet.create({
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: "600" },
});
