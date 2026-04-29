import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
    const { user, logout } = useAuth();
    
    // Estado para armazenar a foto de perfil escolhida pelo usuário
    const [avatarUri, setAvatarUri] = useState(null);

    // Função para escolher imagem da galeria
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,           // um pouco menor para melhor performance
            });

            if (!result.canceled) {
                setAvatarUri(result.assets[0].uri);
                // Aqui você pode futuramente fazer upload para o servidor
                // await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível abrir a galeria.');
        }
    };

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

            {/* Avatar com botão para trocar foto */}
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={
                                avatarUri 
                                    ? { uri: avatarUri }
                                    : require('../../assets/undefined.jpg') // ou use uma imagem padrão
                            }
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                        {/* Ícone de câmera sobreposto */}
                        <View style={styles.cameraIconContainer}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </View>
                </TouchableOpacity>

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
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FF0C5C',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#FF0C5C',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        paddingVertical: 12,
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
        marginTop: 30,
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