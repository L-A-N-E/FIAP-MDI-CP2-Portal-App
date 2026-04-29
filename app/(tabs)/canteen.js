import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { student } from '../../data/student.data';

// Cardápio fixo (mock)
const MENU_ITEMS = [
    { id: 'coxinha', name: 'Coxinha', price: 5.0 },
    { id: 'pao-de-queijo', name: 'Pão de queijo', price: 4.0 },
    { id: 'cafe', name: 'Café', price: 3.5 },
];

export default function Canteen() {
    // Controle de tela
    const [pagina, setPagina] = useState('pedidos');

    // Carrinho: { [itemId]: quantidade }
    const [cart, setCart] = useState({});

    // Estado de envio
    const [submitting, setSubmitting] = useState(false);
    const [mensagem, setMensagem] = useState('');

    // Número gerado ao concluir pedido
    const [meuNumero, setMeuNumero] = useState(null);

    // Fila mockada: número sendo chamado + próximos da fila
    const [chamando, setChamando] = useState(10);
    const [proximos, setProximos] = useState([11, 12]);

    const { width } = Dimensions.get('window');
    const contentMaxWidth = Math.min(width - 32, 460);

    // Itens do cardápio (mock)
    const items = MENU_ITEMS;

    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const total = Object.entries(cart).reduce((sum, [id, qty]) => {
        // Procura o item pelo ID para calcular o total
        const item = items.find(i => i.id === id);
        return sum + (item ? item.price * qty : 0);
    }, 0);

    // Formata número para BRL (R$ 10,00)
    const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const alterarQuantidade = (id, delta) => {
        // Atualiza o carrinho com base no estado anterior
        setCart(prev => {
            const nextQty = Math.max(0, (prev[id] || 0) + delta);
            const next = { ...prev };
            if (nextQty === 0) delete next[id];
            else next[id] = nextQty;
            return next;
        });
    };

    const concluirPedido = () => {
        // Não deixa concluir sem itens, nem enquanto estiver enviando
        if (cartCount === 0 || submitting) return;

        setSubmitting(true);
        setMensagem('Enviando pedido...');

        // Simula um envio: depois de 1s "confirma" e manda pra fila
        setTimeout(() => {
            // Gera o próximo número com base no que já existe na fila
            const maiorNaFila = Math.max(chamando, ...proximos, 0);
            const numero = maiorNaFila + 1;

            setMeuNumero(numero);

            // Coloca seu número na lista de próximos
            setProximos(prev => {
                const next = [...prev, numero];
                const unique = Array.from(new Set(next));
                unique.sort((a, b) => a - b);
                return unique;
            });

            // Vai para a aba/tela da fila
            setPagina('fila');
            setSubmitting(false);
            setMensagem('Pedido concluído. Acompanhe sua posição na fila!');
        }, 900);
    };

    const resetarPedido = () => {
        // Reseta pedido para começar de novo
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
                {/* Header FIAP */}
                <View style={styles.header}>
                    <Text style={styles.title}>Kitchenet</Text>
                    <Text style={styles.title}>{student.unidade}</Text>
                    <Text style={styles.subtitle}>Faça seu pedido e acompanhe a fila</Text>
                </View>

                {/* Tabs internas (Pedido / Fila) */}
                {/* Apenas para testar as abas estão funcionando */}
                {/* <View style={[styles.tabs, { width: contentMaxWidth }]}>
                    <TouchableOpacity
                        style={[styles.tab, pagina === 'pedidos' && styles.tabActive]}
                        onPress={() => setPagina('pedidos')}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.tabText, pagina === 'pedidos' && styles.tabTextActive]}>Pedido</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, pagina === 'fila' && styles.tabActive]}
                        onPress={() => setPagina('fila')}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.tabText, pagina === 'fila' && styles.tabTextActive]}>Fila</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Conteúdo principal: alterna entre Pedido e Fila */}
                {pagina === 'pedidos' ? (
                    <View style={{ width: contentMaxWidth }}>
                        {/* Cabeçalho do Cardápio */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cardápio</Text>
                            <Text style={styles.sectionHint}>{cartCount} item(ns)</Text>
                        </View>

                        {/* Estado vazio (verificação) */}
                        {items.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>Nenhum item encontrado</Text>
                                <Text style={styles.emptyText}>Tente novamente mais tarde.</Text>
                            </View>
                        ) : (
                            /* Lista do cardápio */
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
                                                {/* Botão de diminuir */}
                                                <TouchableOpacity
                                                    style={[styles.qtyButton, qty === 0 && styles.qtyButtonDisabled]}
                                                    onPress={() => alterarQuantidade(item.id, -1)}
                                                    disabled={qty === 0 || submitting}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={styles.qtyButtonText}>-</Text>
                                                </TouchableOpacity>

                                                {/* Quantidade atual */}
                                                <View style={styles.qtyBadge}>
                                                    <Text style={styles.qtyText}>{qty}</Text>
                                                </View>

                                                {/* Botão de aumentar */}
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

                        {/* Resumo do pedido */}
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

                            {/* Painel: o número e o número sendo chamado */}
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

                            {/* Próximos da fila */}
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

                        {/* Ação para começar outro pedido */}
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
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        paddingBottom: 26,
        alignItems: 'center',
        paddingHorizontal: 16,
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
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 6,
        elevation: 2,
        marginBottom: 14,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabActive: {
        backgroundColor: '#FF0C5C',
    },
    tabText: {
        fontWeight: 'bold',
        color: '#666',
    },
    tabTextActive: {
        color: '#fff',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionHint: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        elevation: 3,
        marginBottom: 12,
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 18,
        elevation: 2,
        marginBottom: 12,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemPrice: {
        color: '#FF0C5C',
        fontWeight: 'bold',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FF0C5C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyButtonDisabled: {
        backgroundColor: '#ff7aa5',
    },
    qtyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    qtyBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    qtyText: {
        fontWeight: 'bold',
        color: '#111',
    },
    summaryCard: {
        marginTop: 4,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        elevation: 3,
    },
    summaryLabel: {
        color: '#666',
        fontWeight: 'bold',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
    },
    feedback: {
        marginTop: 10,
        textAlign: 'center',
        color: '#666',
        fontWeight: 'bold',
    },
    primaryButton: {
        marginTop: 12,
        backgroundColor: '#FF0C5C',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#ff7aa5',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    queueTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    queueSub: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 16,
    },
    queueGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    queueBox: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    queueLabel: {
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    queueNumber: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FF0C5C',
    },
    nextTitle: {
        marginTop: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nextRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    nextPill: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#111',
    },
    nextPillMe: {
        backgroundColor: '#FF0C5C',
    },
    nextPillText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    secondaryButton: {
        marginTop: 12,
        backgroundColor: '#111',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});