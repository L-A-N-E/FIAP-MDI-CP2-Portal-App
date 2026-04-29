import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Image, KeyboardAvoidingView,
    ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Cadastro() {
    const router = useRouter();
    const { cadastrar } = useAuth();

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');
    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [erroGeral, setErroGeral] = useState('');

    function validar() {
        const novosErros = {};
        if (!nome.trim()) {
            novosErros.nome = 'O nome completo é obrigatório.';
        }
        if (!email.trim()) {
            novosErros.email = 'O e-mail é obrigatório.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            novosErros.email = 'Formato de e-mail inválido.';
        }
        if (!senha) {
            novosErros.senha = 'A senha é obrigatória.';
        } else if (senha.length < 6) {
            novosErros.senha = 'A senha deve ter no mínimo 6 caracteres.';
        }
        if (!confirmaSenha) {
            novosErros.confirmaSenha = 'Confirme a senha.';
        } else if (confirmaSenha !== senha) {
            novosErros.confirmaSenha = 'As senhas não coincidem.';
        }
        return novosErros;
    }

    async function handleCadastro() {
        setErroGeral('');
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setLoading(true);
        try {
            await cadastrar({
                name: nome.trim().split(' ')[0],
                last_name: nome.trim().split(' ').slice(1).join(' '),
                email: email.trim(),
                senha,
                // campos com valor padrão, o usuário pode editar no perfil futuramente
                rm: '',
                course: '',
                semester: '',
                period: '',
                class: '',
                unidade: '',
            });
            // AuthContext loga automaticamente após cadastro
        } catch (e) {
            setErroGeral(e.message);
        } finally {
            setLoading(false);
        }
    }

    const temErros = Object.keys(validar()).length > 0;

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

                <Text style={styles.titulo}>Criar conta</Text>
                <Text style={styles.subtitulo}>Preencha os campos abaixo para se cadastrar</Text>

                {/* nome completo */}
                <View style={styles.campo}>
                    <Text style={styles.label}>Nome completo</Text>
                    <TextInput
                        style={[styles.input, erros.nome && styles.inputErro]}
                        placeholder="Seu nome completo"
                        autoCapitalize="words"
                        value={nome}
                        onChangeText={(v) => {
                            setNome(v);
                            setErros((prev) => ({ ...prev, nome: undefined }));
                        }}
                    />
                    {erros.nome && <Text style={styles.erroInline}>{erros.nome}</Text>}
                </View>

                {/* e-mail */}
                <View style={styles.campo}>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={[styles.input, erros.email && styles.inputErro]}
                        placeholder="usuario@dominio.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(v) => {
                            setEmail(v);
                            setErros((prev) => ({ ...prev, email: undefined }));
                            setErroGeral('');
                        }}
                    />
                    {erros.email && <Text style={styles.erroInline}>{erros.email}</Text>}
                </View>

                {/* senha */}
                <View style={styles.campo}>
                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={[styles.input, erros.senha && styles.inputErro]}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry
                        value={senha}
                        onChangeText={(v) => {
                            setSenha(v);
                            setErros((prev) => ({ ...prev, senha: undefined }));
                        }}
                    />
                    {erros.senha && <Text style={styles.erroInline}>{erros.senha}</Text>}
                </View>

                {/* confirmar senha */}
                <View style={styles.campo}>
                    <Text style={styles.label}>Confirmar senha</Text>
                    <TextInput
                        style={[styles.input, erros.confirmaSenha && styles.inputErro]}
                        placeholder="Repita a senha"
                        secureTextEntry
                        value={confirmaSenha}
                        onChangeText={(v) => {
                            setConfirmaSenha(v);
                            setErros((prev) => ({ ...prev, confirmaSenha: undefined }));
                        }}
                    />
                    {erros.confirmaSenha && (
                        <Text style={styles.erroInline}>{erros.confirmaSenha}</Text>
                    )}
                </View>

                {/* erro geral (ex: e-mail já cadastrado) */}
                {erroGeral ? (
                    <Text style={styles.erroGeral}>{erroGeral}</Text>
                ) : null}

                {/* botão cadastrar */}
                <TouchableOpacity
                    style={[styles.botao, temErros && styles.botaoDesabilitado]}
                    onPress={handleCadastro}
                    disabled={temErros || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.botaoTexto}>Criar conta</Text>
                    )}
                </TouchableOpacity>

                {/* voltar para login */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.linkContainer}
                >
                    <Text style={styles.linkTexto}>
                        Já tem conta?{' '}
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
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    logo: {
        width: 140,
        height: 60,
        marginBottom: 24,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#171717',
    },
    subtitulo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    campo: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
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
    inputErro: {
        borderColor: '#e53935',
    },
    erroInline: {
        color: '#e53935',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
    },
    erroGeral: {
        color: '#e53935',
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
    },
    botao: {
        width: '100%',
        backgroundColor: '#FF0C5C',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    botaoDesabilitado: {
        opacity: 0.5,
    },
    botaoTexto: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 20,
    },
    linkTexto: {
        fontSize: 14,
        color: '#666',
    },
    linkDestaque: {
        color: '#FF0C5C',
        fontWeight: 'bold',
    },
});
