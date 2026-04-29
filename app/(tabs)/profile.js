import {
    View, Text, StyleSheet, Image,
    TouchableOpacity, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
    const { user, logout } = useAuth();

    function InfoRow({ label, value }) {
        return (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || '—'}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/FIAP.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Meu Perfil</Text>
            </View>

            {/* Avatar / iniciais */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                </View>
                <Text style={styles.nomeCompleto}>
                    {user?.name} {user?.last_name}
                </Text>
                <Text style={styles.emailTexto}>{user?.email}</Text>
            </View>

            {/* Card de informações */}
            <View style={styles.card}>
                <Text style={styles.cardTitulo}>Dados Acadêmicos</Text>
                <InfoRow label="RM" value={user?.rm} />
                <InfoRow label="Curso" value={user?.course} />
                <InfoRow label="Semestre" value={user?.semester} />
                <InfoRow label="Turma" value={user?.class} />
                <InfoRow label="Período" value={user?.period} />
                <InfoRow label="Unidade" value={user?.unidade} />
            </View>

            {/* Botão Logout */}
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
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 30,
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 140,
        height: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF0C5C',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    nomeCompleto: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#171717',
    },
    emailTexto: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    card: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        elevation: 3,
    },
    cardTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#FF0C5C',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#171717',
    },
    logoutContainer: {
        margin: 20,
        marginTop: 24,
    },
    botaoLogout: {
        backgroundColor: '#FF0C5C',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    botaoLogoutTexto: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
