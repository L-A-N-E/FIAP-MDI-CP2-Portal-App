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
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Campo({
    label,
    campoKey,
    value,
    onChange,
    placeholder,
    keyboardType,
    erros,
    setErros,
    colors,
}) {
    return (
        <View style={styles.campo}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    erros[campoKey] && styles.inputErro,
                    {
                        backgroundColor: colors.inputBg,
                        borderColor: erros[campoKey]
                            ? "#e53935"
                            : colors.inputBorder,
                        color: colors.text,
                    },
                ]}
                placeholder={placeholder ?? label}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={(v) => {
                    onChange(v);
                    setErros((prev) => ({ ...prev, [campoKey]: undefined }));
                }}
                keyboardType={keyboardType ?? "default"}
                autoCapitalize="sentences"
            />
            <Text style={styles.erroInline}>{erros[campoKey] ?? " "}</Text>
        </View>
    );
}

export default function CompleteProfile() {
    const { completarPerfil, user } = useAuth();
    const { colors } = useTheme();
    const isTeacher = user?.role === "teacher";

    const [rm, setRm] = useState("");
    const [curso, setCurso] = useState("");
    const [semestre, setSemestre] = useState("");
    const [turma, setTurma] = useState("");
    const [periodo, setPeriodo] = useState("");
    const [unidade, setUnidade] = useState("");

    const [idProfessor, setIdProfessor] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [unidadeProf, setUnidadeProf] = useState("");

    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);

    function validar() {
        const novosErros = {};
        if (isTeacher) {
            if (!idProfessor.trim())
                novosErros.idProfessor = "O ID é obrigatório.";
            if (!departamento.trim())
                novosErros.departamento = "O departamento é obrigatório.";
            if (!unidadeProf.trim())
                novosErros.unidadeProf = "A unidade é obrigatória.";
        } else {
            if (!rm.trim()) novosErros.rm = "O RM é obrigatório.";
            if (!curso.trim()) novosErros.curso = "O curso é obrigatório.";
            if (!semestre.trim())
                novosErros.semestre = "O semestre é obrigatório.";
            if (!turma.trim()) novosErros.turma = "A turma é obrigatória.";
            if (!periodo.trim())
                novosErros.periodo = "O período é obrigatório.";
            if (!unidade.trim())
                novosErros.unidade = "A unidade é obrigatória.";
        }
        return novosErros;
    }

    async function handleCompletar() {
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setLoading(true);
        try {
            if (isTeacher) {
                await completarPerfil({
                    id: idProfessor.trim(),
                    department: departamento.trim(),
                    unidade: unidadeProf.trim(),
                });
            } else {
                await completarPerfil({
                    rm: rm.trim(),
                    course: curso.trim(),
                    semester: semestre.trim(),
                    class: turma.trim(),
                    period: periodo.trim(),
                    unidade: unidade.trim(),
                });
            }
        } catch (e) {
            console.warn(e);
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
                contentContainerStyle={[
                    styles.container,
                    { backgroundColor: colors.bg },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.titulo, { color: colors.text }]}>
                    Complete seu perfil
                </Text>
                <Text
                    style={[styles.subtitulo, { color: colors.textSecondary }]}
                >
                    {isTeacher
                        ? "Dados do professor"
                        : "Dados acadêmicos do aluno"}
                </Text>

                {isTeacher ? (
                    <>
                        <Campo
                            label="ID"
                            campoKey="idProfessor"
                            value={idProfessor}
                            onChange={setIdProfessor}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: PROF001"
                            colors={colors}
                        />
                        <Campo
                            label="Departamento"
                            campoKey="departamento"
                            value={departamento}
                            onChange={setDepartamento}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: Engenharia de Software"
                            colors={colors}
                        />
                        <Campo
                            label="Unidade"
                            campoKey="unidadeProf"
                            value={unidadeProf}
                            onChange={setUnidadeProf}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: FIAP Paulista"
                            colors={colors}
                        />
                    </>
                ) : (
                    <>
                        <Campo
                            label="RM"
                            campoKey="rm"
                            value={rm}
                            onChange={setRm}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: 556259"
                            keyboardType="numeric"
                            colors={colors}
                        />
                        <Campo
                            label="Curso"
                            campoKey="curso"
                            value={curso}
                            onChange={setCurso}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: Engenharia de Software"
                            colors={colors}
                        />
                        <Campo
                            label="Semestre"
                            campoKey="semestre"
                            value={semestre}
                            onChange={setSemestre}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: 3º Ano"
                            colors={colors}
                        />
                        <Campo
                            label="Turma"
                            campoKey="turma"
                            value={turma}
                            onChange={setTurma}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: 3ESPH"
                            colors={colors}
                        />
                        <Campo
                            label="Período"
                            campoKey="periodo"
                            value={periodo}
                            onChange={setPeriodo}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: Matutino"
                            colors={colors}
                        />
                        <Campo
                            label="Unidade"
                            campoKey="unidade"
                            value={unidade}
                            onChange={setUnidade}
                            erros={erros}
                            setErros={setErros}
                            placeholder="Ex: FIAP Paulista"
                            colors={colors}
                        />
                    </>
                )}

                <TouchableOpacity
                    style={styles.botao}
                    onPress={handleCompletar}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.botaoTexto}>Salvar e entrar</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    logo: { width: 140, height: 60, marginBottom: 24 },
    titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 6 },
    subtitulo: { fontSize: 14, marginBottom: 24, textAlign: "center" },
    campo: { width: "100%", marginBottom: 4 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    inputErro: { borderColor: "#e53935" },
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
});
