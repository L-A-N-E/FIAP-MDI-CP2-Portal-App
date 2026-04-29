import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const MENU_ITEMS = [
    { id: 'coxinha', name: 'Coxinha', price: 5.0 },
    { id: 'pao-de-queijo', name: 'Pão de queijo', price: 4.0 },
    { id: 'cafe', name: 'Café', price: 3.5 },
];

export default function Canteen() {
    const { user } = useAuth();

    const [pagina, setPagina] = useState('pedidos');
    const [cart, setCart] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [meuNumero, setMeuNumero] = useState(null);
    const [chamando, setChamando] = useState(10);
    const [proximos, setProximos] = useState([11, 12]);

    const { width } = Dimensions.get('window');
    const contentMaxWidth = Math.min(width - 32, 460);

    const items = MENU_ITEMS;

    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const total = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = items.find(i => i.id === id);
        return sum + (item ? item.price * qty : 0);
    }, 0);

    const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const alterarQuantidade = (id, delta) => {
        setCart(prev => {
            const nextQty = Math.max(0, (prev[id] || 0) + delta);
            const next = { ...prev };
            if (nextQty === 0) delete next[id];
            else next[id] = nextQty;
            return next;
        });
    };

    const concluirPedido = () => {
        if (cartCount === 0 || submitting) return;
        setSubmitting(true);
        setMensagem('Enviando pedido...');
        setTimeout(() => {
            const maiorNaFila = Math.max(chamando, ...proximos, 0);
            const numero = maiorNaFila + 1;
            setMeuNumero(numero);
            setProximos(prev => {
                const next = [...prev, numero];
                const unique = Array.from(new Set(next));
                unique.sort((a, b) => a - b);
                return unique;
            });
            setPagina('fila');
            setSubmitting(false);
            setMensagem('Pedido concluído. Acompanhe sua posição na fila!');
        }, 900);
    };

    const resetarPedido = () => {
        setPagina('pedidos');
        setCart({});
        setMeuNumero(null);
        setMensagem('');
        setSubmitting(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Kitchenet</Text>
                    {/* unidade vem do usuário logado via AuthContext */}
                    <Text style={styles.title}>{user?.unidade ?? ''}</Text>
                    <Text style={styles.subtitle}>Faça seu pedido e acompanhe a fila</Text>
                </View>

                {pagina === 'pedidos' ? (
                    <View style={{ width: contentMaxWidth }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cardápio</Text>
                            <Text style={styles.sectionHint}>{cartCount} item(ns)</Text>
                        </View>

                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>Nenhum item encontrado</Text>
                                <Text style={styles.emptyText}>Tente novamente mais tarde.</Text>
                            </View>
                        ) : (
                            items.map((item) => {
                                const qty = cart[item.id] || 0;
                                return (
                                    <View key={item.id} style={styles.card}>
                                        <View style={styles.rowBetween}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemPrice}>{formatBRL(item.price)}</Text>
                                            </View>
                                            <View style={styles.qtyControls}>
                                                <TouchableOpacity
                                                    style={[styles.qtyButton, qty === 0 && styles.qtyButtonDisabled]}
                                                    onPress={() => alterarQuantidade(item.id, -1)}
                                                    disabled={qty === 0 || submitting}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={styles.qtyButtonText}>-</Text>
                                                </TouchableOpacity>
                                                <View style={styles.qtyBadge}>
                                                    <Text style={styles.qtyText}>{qty}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.qtyButton}
                                                    onPress={() => alterarQuantidade(item.id, +1)}
                                                    disabled={submitting}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={styles.qtyButtonText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        <View style={styles.summaryCard}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.summaryLabel}>Total</Text>
                                <Text style={styles.summaryValue}>{formatBRL(total)}</Text>
                            </View>
                            {!!mensagem && <Text style={styles.feedback}>{mensagem}</Text>}
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    (cartCount === 0 || submitting) && styles.primaryButtonDisabled,
                                ]}
                                onPress={concluirPedido}
                                disabled={cartCount === 0 || submitting}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {submitting ? 'Carregando...' : 'Concluir pedido'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={{ width: contentMaxWidth }}>
                        <View style={styles.card}>
                            <Text style={styles.queueTitle}>Fila de pedidos</Text>
                            <Text style={styles.queueSub}>Acompanhe sua chamada</Text>
                            <View style={styles.queueGrid}>
                                <View style={styles.queueBox}>
                                    <Text style={styles.queueLabel}>Seu número</Text>
                                    <Text style={styles.queueNumber}>{meuNumero ?? '--'}</Text>
                                </View>
                                <View style={styles.queueBox}>
                                    <Text style={styles.queueLabel}>Chamando</Text>
                                    <Text style={styles.queueNumber}>{chamando}</Text>
                                </View>
                            </View>
                            <Text style={styles.nextTitle}>Próximos</Text>
                            <View style={styles.nextRow}>
                                {proximos.length === 0 ? (
                                    <Text style={styles.emptyText}>Sem próximos no momento.</Text>
                                ) : (
                                    proximos.map((n) => {
                                        const isMe = typeof meuNumero === 'number' && n === meuNumero;
                                        return (
                                            <View
                                                key={String(n)}
                                                style={[styles.nextPill, isMe && styles.nextPillMe]}
                                            >
                                                <Text style={styles.nextPillText}>{n}</Text>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                            {!!mensagem && <Text style={styles.feedback}>{mensagem}</Text>}
                        </View>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={resetarPedido}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.secondaryButtonText}>Fazer novo pedido</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    scrollContent: { 
        paddingBottom: 26, 
        alignItems: 'center', 
        paddingHorizontal: 16 
    },
    header: { 
        paddingTop: 30, 
        alignItems: 'center', 
        marginBottom: 10 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 6 
    },
    subtitle: { 
        color: '#666', 
        fontSize: 14, 
        textAlign: 'center' 
    },
    sectionHeader: { 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        justifyContent: 'space-between', 
        marginBottom: 10, 
        paddingHorizontal: 2 
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    sectionHint: { 
        fontSize: 12, 
        color: '#666', 
        fontWeight: 'bold' 
    },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        padding: 16, 
        elevation: 3, 
        marginBottom: 12 
    },
    emptyCard: { 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        padding: 18, 
        elevation: 2, 
        marginBottom: 12, 
        alignItems: 'center' 
    },
    emptyTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 6 
    },
    emptyText: { 
        color: '#666', 
        textAlign: 'center' 
    },
    rowBetween: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: 12 
    },
    itemName: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 4 
    },
    itemPrice: { 
        color: '#FF0C5C', 
        fontWeight: 'bold' 
    },
    qtyControls: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    qtyButton: { 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        backgroundColor: '#FF0C5C', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    qtyButtonDisabled: { 
        backgroundColor: '#ff7aa5' 
    },
    qtyButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    qtyBadge: { 
        minWidth: 36, 
        height: 36, 
        borderRadius: 10, 
        backgroundColor: '#f5f5f5', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: 8 
    },
    qtyText: { 
        fontWeight: 'bold', 
        color: '#111' 
    },
    summaryCard: { 
        marginTop: 4, 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        padding: 16, 
        elevation: 3 
    },
    summaryLabel: { 
        color: '#666', 
        fontWeight: 'bold' 
    },
    summaryValue: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#111' 
    },
    feedback: { 
        marginTop: 10, 
        textAlign: 'center', 
        color: '#666', 
        fontWeight: 'bold' 
    },
    primaryButton: { 
        marginTop: 12, 
        backgroundColor: '#FF0C5C', 
        paddingVertical: 14, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    primaryButtonDisabled: { 
        backgroundColor: '#ff7aa5' 
    },
    primaryButtonText: { 
        color: '#fff', 
        fontWeightP: 'bold', 
        fontSize: 16 
    },
    queueTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 4 
    },
    queueSub: { 
        textAlign: 'center', 
        color: '#666', 
        marginBottom: 16 
    },
    queueGrid: { 
        flexDirection: 'row', 
        gap: 12 
    },
    queueBox: { 
        flex: 1, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 14, 
        paddingVertical: 14, 
        paddingHorizontal: 12, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    queueLabel: { 
        color: '#666', 
        fontWeight: 'bold', 
        marginBottom: 8 
    },
    queueNumber: { 
        fontSize: 26, 
        fontWeight: 'bold', 
        color: '#FF0C5C' 
    },
    nextTitle: { 
        marginTop: 16, 
        fontWeight: 'bold', 
        textAlign: 'center' 
    },
    nextRow: { 
        marginTop: 10, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        gap: 10, 
        flexWrap: 'wrap' 
    },
    nextPill: { 
        paddingVertical: 10, 
        paddingHorizontal: 14, 
        borderRadius: 999, 
        backgroundColor: '#111' 
    },
    nextPillMe: { 
        backgroundColor: '#FF0C5C' 
    },
    nextPillText: { 
        color: '#fff', 
        fontWeight: 'bold' 
    },
    secondaryButton: { 
        marginTop: 12, 
        backgroundColor: '#111', 
        paddingVertical: 14, 
        borderRadius: 12, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    secondaryButtonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16 
    },
});
