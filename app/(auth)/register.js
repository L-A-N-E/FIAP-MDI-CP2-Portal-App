import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

function CampoInput({
    label,
    chave,
    value,
    onChange,
    placeholder,
    secure,
    keyboard,
    erros,
    setErros,
    setErroGeral,
}) {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const ehSenha = secure === true;

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input,
                        ehSenha && styles.inputComIcone,
                        erros[chave] && styles.inputErro,
                    ]}
                    placeholder={placeholder}
                    secureTextEntry={ehSenha && !mostrarSenha}
                    keyboardType={keyboard ?? "default"}
                    autoCapitalize={
                        keyboard === "email-address" ? "none" : "words"
                    }
                    value={value}
                    onChangeText={(v) => {
                        onChange(v);
                        setErros((prev) => ({ ...prev, [chave]: undefined }));
                        if (setErroGeral) setErroGeral("");
                    }}
                />
                {ehSenha && (
                    <TouchableOpacity
                        style={styles.olhoIcone}
                        onPress={() => setMostrarSenha((prev) => !prev)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={
                                mostrarSenha ? "eye-outline" : "eye-off-outline"
                            }
                            size={20}
                            color="#999"
                        />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.erroInline}>{erros[chave] ?? " "}</Text>
        </View>
    );
}

export default function Register() {
    const router = useRouter();
    const { cadastrar } = useAuth();

    const [papel, setPapel] = useState("student"); // 'student' | 'teacher'
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [erroGeral, setErroGeral] = useState("");

    function validar() {
        const novosErros = {};
        if (!nome.trim()) novosErros.nome = "O nome completo é obrigatório.";
        if (!email.trim()) {
            novosErros.email = "O e-mail é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            novosErros.email = "Formato de e-mail inválido.";
        }
        if (!senha) {
            novosErros.senha = "A senha é obrigatória.";
        } else if (senha.length < 6) {
            novosErros.senha = "A senha deve ter no mínimo 6 caracteres.";
        }
        if (!confirmaSenha) {
            novosErros.confirmaSenha = "Confirme a senha.";
        } else if (confirmaSenha !== senha) {
            novosErros.confirmaSenha = "As senhas não coincidem.";
        }
        return novosErros;
    }

    async function handleCadastro() {
        setErroGeral("");
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setLoading(true);
        try {
            await cadastrar({
                name: nome.trim().split(" ")[0],
                last_name: nome.trim().split(" ").slice(1).join(" "),
                email: email.trim(),
                senha,
                role: papel,
                // campos completados na próxima tela
                rm: "",
                id: "",
                course: "",
                semester: "",
                period: "",
                class: "",
                unidade: "",
                department: "",
            });
            router.replace("/(auth)/complete_profile");
        } catch (e) {
            setErroGeral(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.titulo}>Criar conta</Text>
                <Text style={styles.subtitulo}>
                    Preencha os campos abaixo para se cadastrar
                </Text>

                {/* Seletor de papel */}
                <View style={styles.papelContainer}>
                    <TouchableOpacity
                        style={[
                            styles.papelBotao,
                            papel === "student" && styles.papelBotaoAtivo,
                        ]}
                        onPress={() => setPapel("student")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="school-outline"
                            size={16}
                            color={papel === "student" ? "#fff" : "#666"}
                        />
                        <Text
                            style={[
                                styles.papelTexto,
                                papel === "student" && styles.papelTextoAtivo,
                            ]}
                        >
                            Aluno
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.papelBotao,
                            papel === "teacher" && styles.papelBotaoAtivo,
                        ]}
                        onPress={() => setPapel("teacher")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="person-outline"
                            size={16}
                            color={papel === "teacher" ? "#fff" : "#666"}
                        />
                        <Text
                            style={[
                                styles.papelTexto,
                                papel === "teacher" && styles.papelTextoAtivo,
                            ]}
                        >
                            Professor
                        </Text>
                    </TouchableOpacity>
                </View>

                <CampoInput
                    label="Nome completo"
                    chave="nome"
                    value={nome}
                    onChange={setNome}
                    placeholder="Seu nome completo"
                    erros={erros}
                    setErros={setErros}
                />
                <CampoInput
                    label="E-mail"
                    chave="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="usuario@dominio.com"
                    keyboard="email-address"
                    erros={erros}
                    setErros={setErros}
                    setErroGeral={setErroGeral}
                />
                <CampoInput
                    label="Senha"
                    chave="senha"
                    value={senha}
                    onChange={setSenha}
                    placeholder="Mínimo 6 caracteres"
                    secure
                    erros={erros}
                    setErros={setErros}
                />
                <CampoInput
                    label="Confirmar senha"
                    chave="confirmaSenha"
                    value={confirmaSenha}
                    onChange={setConfirmaSenha}
                    placeholder="Repita a senha"
                    secure
                    erros={erros}
                    setErros={setErros}
                />

                <Text
                    style={[
                        styles.erroInline,
                        { textAlign: "center", marginBottom: 4 },
                    ]}
                >
                    {erroGeral ?? " "}
                </Text>

                <TouchableOpacity
                    style={styles.botao}
                    onPress={handleCadastro}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.botaoTexto}>Criar conta</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.linkContainer}
                >
                    <Text style={styles.linkTexto}>
                        Já tem conta?{" "}
                        <Text style={styles.linkDestaque}>Entrar</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    logo: { width: 140, height: 60, marginBottom: 24 },
    titulo: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 6,
        color: "#171717",
    },
    subtitulo: {
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
        textAlign: "center",
    },
    papelContainer: {
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#eee",
    },
    papelBotao: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    papelBotaoAtivo: { backgroundColor: "#FF0C5C" },
    papelTexto: { fontSize: 14, fontWeight: "600", color: "#666" },
    papelTextoAtivo: { color: "#fff" },
    campo: { width: "100%", marginBottom: 4 },
    label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
    inputWrapper: { position: "relative", justifyContent: "center" },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#171717",
    },
    inputComIcone: { paddingRight: 44 },
    inputErro: { borderColor: "#e53935" },
    olhoIcone: { position: "absolute", right: 14 },
    erroInline: {
        color: "#e53935",
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
        minHeight: 18,
    },
    botao: {
        width: "100%",
        backgroundColor: "#FF0C5C",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 8,
    },
    botaoTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    linkContainer: { marginTop: 20 },
    linkTexto: { fontSize: 14, color: "#666" },
    linkDestaque: { color: "#FF0C5C", fontWeight: "bold" },
});
