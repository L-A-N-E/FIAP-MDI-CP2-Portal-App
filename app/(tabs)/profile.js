import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || "—"}</Text>
        </View>
    );
}

export default function Profile() {
    const { user, logout } = useAuth();
    const isTeacher = user?.role === "teacher";

    const [avatarUri, setAvatarUri] = useState(null);
    const [loadingPhoto, setLoadingPhoto] = useState(true);

    const photoKey = `@fiap_photo_${user?.email}`;

    // Carrega foto salva no AsyncStorage ao montar
    useEffect(() => {
        async function loadPhoto() {
            try {
                const saved = await AsyncStorage.getItem(photoKey);
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
                // Salva no AsyncStorage vinculado ao email do usuário
                await AsyncStorage.setItem(photoKey, uri);
            }
        } catch (_) {
            Alert.alert("Erro", "Não foi possível abrir a galeria.");
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Meu Perfil</Text>
                {isTeacher && (
                    <View style={styles.badgeProfessor}>
                        <Text style={styles.badgeTexto}>Professor</Text>
                    </View>
                )}
            </View>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    <View style={styles.avatarWrapper}>
                        {loadingPhoto ? (
                            <View
                                style={[
                                    styles.avatar,
                                    styles.avatarPlaceholder,
                                ]}
                            >
                                <ActivityIndicator color="#FF0C5C" />
                            </View>
                        ) : avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={[
                                    styles.avatar,
                                    styles.avatarPlaceholder,
                                ]}
                            >
                                <Text style={styles.avatarTexto}>
                                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                                </Text>
                            </View>
                        )}
                        <View style={styles.cameraIconContainer}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </View>
                </TouchableOpacity>
                <Text style={styles.nomeCompleto}>
                    {user?.name} {user?.last_name}
                </Text>
                <Text style={styles.emailTexto}>{user?.email}</Text>
            </View>

            {/* Dados */}
            <View style={styles.card}>
                <Text style={styles.cardTitulo}>
                    {isTeacher ? "Dados Profissionais" : "Dados Acadêmicos"}
                </Text>
                {isTeacher ? (
                    <>
                        <InfoRow label="ID" value={user?.id} />
                        <InfoRow
                            label="Departamento"
                            value={user?.department}
                        />
                        <InfoRow label="Unidade" value={user?.unidade} />
                    </>
                ) : (
                    <>
                        <InfoRow label="RM" value={user?.rm} />
                        <InfoRow label="Curso" value={user?.course} />
                        <InfoRow label="Semestre" value={user?.semester} />
                        <InfoRow label="Turma" value={user?.class} />
                        <InfoRow label="Período" value={user?.period} />
                        <InfoRow label="Unidade" value={user?.unidade} />
                    </>
                )}
            </View>

            <View style={styles.logoutContainer}>
                <TouchableOpacity
                    style={styles.botaoLogout}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.botaoLogoutTexto}>Sair da conta</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
    logo: { width: 140, height: 60 },
    title: { fontSize: 24, fontWeight: "bold", marginTop: 4 },
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
    nomeCompleto: { fontSize: 20, fontWeight: "bold", color: "#171717" },
    emailTexto: { fontSize: 14, color: "#666", marginTop: 4 },
    card: {
        marginHorizontal: 20,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 20,
        elevation: 3,
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
        borderBottomColor: "#f0f0f0",
    },
    infoLabel: { fontSize: 14, color: "#666" },
    infoValue: { fontSize: 14, fontWeight: "600", color: "#171717" },
    logoutContainer: { margin: 20, marginTop: 30 },
    botaoLogout: {
        backgroundColor: "#FF0C5C",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    botaoLogoutTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
