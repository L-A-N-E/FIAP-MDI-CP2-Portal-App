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
import { useTheme } from "../../context/ThemeContext";

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const { colors } = useTheme();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [erroGeral, setErroGeral] = useState("");

    function validar() {
        const novosErros = {};
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
        return novosErros;
    }

    async function handleLogin() {
        setErroGeral("");
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;
        setLoading(true);
        try {
            await login(email.trim(), senha);
        } catch (e) {
            setErroGeral(e.message);
        } finally {
            setLoading(false);
        }
    }

    const temErros = Object.keys(validar()).length > 0;
    const s = makeStyles(colors);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={s.logo}
                    resizeMode="contain"
                />
                <Text style={s.titulo}>Entrar na conta</Text>
                <Text style={s.subtitulo}>
                    Use seu e-mail institucional da FIAP
                </Text>

                <View style={s.campo}>
                    <Text style={s.label}>E-mail</Text>
                    <TextInput
                        style={[s.input, erros.email && s.inputErro]}
                        placeholder="rm000000@fiap.com.br"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(v) => {
                            setEmail(v);
                            setErros((p) => ({ ...p, email: undefined }));
                            setErroGeral("");
                        }}
                    />
                    {erros.email && (
                        <Text style={s.erroInline}>{erros.email}</Text>
                    )}
                </View>

                <View style={s.campo}>
                    <Text style={s.label}>Senha</Text>
                    <TextInput
                        style={[s.input, erros.senha && s.inputErro]}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={senha}
                        onChangeText={(v) => {
                            setSenha(v);
                            setErros((p) => ({ ...p, senha: undefined }));
                            setErroGeral("");
                        }}
                    />
                    {erros.senha && (
                        <Text style={s.erroInline}>{erros.senha}</Text>
                    )}
                </View>

                {erroGeral ? (
                    <Text style={s.erroGeral}>{erroGeral}</Text>
                ) : null}

                <TouchableOpacity
                    style={[s.botao, temErros && s.botaoDesabilitado]}
                    onPress={handleLogin}
                    disabled={temErros || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={s.botaoTexto}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
                    style={s.linkContainer}
                >
                    <Text style={s.linkTexto}>
                        Não tem conta?{" "}
                        <Text style={s.linkDestaque}>Cadastre-se</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function makeStyles(c) {
    return StyleSheet.create({
        container: {
            flexGrow: 1,
            backgroundColor: c.bg,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        logo: { width: 140, height: 60, marginBottom: 24 },
        titulo: {
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 6,
            color: c.text,
        },
        subtitulo: {
            fontSize: 14,
            color: c.textSecondary,
            marginBottom: 32,
            textAlign: "center",
        },
        campo: { width: "100%", marginBottom: 16 },
        label: {
            fontSize: 14,
            fontWeight: "600",
            color: c.text,
            marginBottom: 6,
        },
        input: {
            backgroundColor: c.inputBg,
            borderWidth: 1,
            borderColor: c.inputBorder,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            color: c.text,
        },
        inputErro: { borderColor: "#e53935" },
        erroInline: {
            color: "#e53935",
            fontSize: 12,
            marginTop: 4,
            marginLeft: 2,
        },
        erroGeral: {
            color: "#e53935",
            fontSize: 13,
            marginBottom: 12,
            textAlign: "center",
        },
        botao: {
            width: "100%",
            backgroundColor: "#FF0C5C",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 8,
        },
        botaoDesabilitado: { opacity: 0.5 },
        botaoTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
        linkContainer: { marginTop: 20 },
        linkTexto: { fontSize: 14, color: c.textSecondary },
        linkDestaque: { color: "#FF0C5C", fontWeight: "bold" },
    });
}
