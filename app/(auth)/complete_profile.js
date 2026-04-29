import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Image, KeyboardAvoidingView,
    ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function CampoSimples({ label, campoKey, value, onChange, placeholder, keyboardType, erros, setErros }) {
    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, erros[campoKey] && styles.inputErro]}
                placeholder={placeholder ?? label}
                value={value}
                onChangeText={(v) => {
                    onChange(v);
                    setErros((prev) => ({ ...prev, [campoKey]: undefined }));
                }}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize="sentences"
            />
            <Text style={styles.erroInline}>{erros[campoKey] ?? ' '}</Text>
        </View>
    );
}

export default function CompletarPerfil() {
    const { completarPerfil } = useAuth();

    const [rm, setRm] = useState('');
    const [curso, setCurso] = useState('');
    const [semestre, setSemestre] = useState('');
    const [turma, setTurma] = useState('');
    const [periodo, setPeriodo] = useState('');
    const [unidade, setUnidade] = useState('');
    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);

    function validar() {
        const novosErros = {};
        if (!rm.trim()) novosErros.rm = 'O RM é obrigatório.';
        if (!curso.trim()) novosErros.curso = 'O curso é obrigatório.';
        if (!semestre.trim()) novosErros.semestre = 'O semestre é obrigatório.';
        if (!turma.trim()) novosErros.turma = 'A turma é obrigatória.';
        if (!periodo.trim()) novosErros.periodo = 'O período é obrigatório.';
        if (!unidade.trim()) novosErros.unidade = 'A unidade é obrigatória.';
        return novosErros;
    }

    async function handleCompletar() {
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setLoading(true);
        try {
            await completarPerfil({
                rm: rm.trim(),
                course: curso.trim(),
                semester: semestre.trim(),
                class: turma.trim(),
                period: periodo.trim(),
                unidade: unidade.trim(),
            });
            // completarPerfil seta needsProfileCompletion = false
            // _layout detecta user logado fora de (auth) e redireciona para (tabs)/
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Image
                    source={require('../../assets/FIAP.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.titulo}>Complete seu perfil</Text>
                <Text style={styles.subtitulo}>
                    Preencha seus dados acadêmicos para continuar
                </Text>

                <CampoSimples label="RM" campoKey="rm" value={rm} onChange={setRm} erros={erros} setErros={setErros} placeholder="556259" keyboardType="numeric" />
                <CampoSimples label="Curso" campoKey="curso" value={curso} onChange={setCurso} erros={erros} setErros={setErros} placeholder="Engenharia de Software" />
                <CampoSimples label="Semestre" campoKey="semestre" value={semestre} onChange={setSemestre} erros={erros} setErros={setErros} placeholder="1" /> 
                <CampoSimples label="Turma" campoKey="turma" value={turma} onChange={setTurma} erros={erros} setErros={setErros} placeholder="1ESPH" />
                <CampoSimples label="Período" campoKey="periodo" value={periodo} onChange={setPeriodo} erros={erros} setErros={setErros} placeholder="Matutino" />
                <CampoSimples label="Unidade" campoKey="unidade" value={unidade} onChange={setUnidade} erros={erros} setErros={setErros} placeholder="Paulista" />

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
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logo: { width: 140, height: 60, marginBottom: 24 },
    titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, color: '#171717' },
    subtitulo: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
    campo: { width: '100%', marginBottom: 4 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#171717',
    },
    inputErro: { borderColor: '#e53935' },
    erroInline: { color: '#e53935', fontSize: 12, marginTop: 4, marginLeft: 2, minHeight: 18 },
    botao: {
        width: '100%',
        backgroundColor: '#FF0C5C',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    botaoTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
