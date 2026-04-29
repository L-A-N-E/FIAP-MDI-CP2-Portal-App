import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Modal,
    TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";

// Itens fixos — apenas estoque é persistido
const MENU_ITEMS = [
    { id: "coxinha", name: "Coxinha", price: 5.0, defaultStock: 30 },
    {
        id: "pao-de-queijo",
        name: "Pão de queijo",
        price: 4.0,
        defaultStock: 30,
    },
    { id: "cafe", name: "Café", price: 3.5, defaultStock: 50 },
];

const STOCK_KEY = "@fiap_canteen_stock";
const ORDERS_KEY = "@fiap_canteen_orders";

const { width } = Dimensions.get("window");
const maxW = Math.min(width - 32, 460);

export default function Canteen() {
    const { user } = useAuth();
    const isTeacher = user?.role === "teacher";

    const [stock, setStock] = useState(null); // { id: qty }
    const [orders, setOrders] = useState([]); // histórico
    const [cart, setCart] = useState({});
    const [pagina, setPagina] = useState("pedidos"); // 'pedidos' | 'fila' | 'historico'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [meuNumero, setMeuNumero] = useState(null);

    // modal de edição de estoque (professor)
    const [editModal, setEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editValor, setEditValor] = useState("");

    // Carrega estoque e pedidos
    useEffect(() => {
        async function load() {
            try {
                const sJson = await AsyncStorage.getItem(STOCK_KEY);
                if (sJson) {
                    setStock(JSON.parse(sJson));
                } else {
                    // Inicializa estoque padrão
                    const inicial = {};
                    MENU_ITEMS.forEach((i) => {
                        inicial[i.id] = i.defaultStock;
                    });
                    await AsyncStorage.setItem(
                        STOCK_KEY,
                        JSON.stringify(inicial),
                    );
                    setStock(inicial);
                }
                const oJson = await AsyncStorage.getItem(ORDERS_KEY);
                if (oJson) setOrders(JSON.parse(oJson));
            } catch (_) {
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const formatBRL = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
    const total = Object.entries(cart).reduce((s, [id, q]) => {
        const item = MENU_ITEMS.find((i) => i.id === id);
        return s + (item ? item.price * q : 0);
    }, 0);

    function alterarQtd(id, delta) {
        setCart((prev) => {
            const next = Math.max(0, (prev[id] || 0) + delta);
            // não ultrapassa estoque
            const estoqueDisp = stock?.[id] ?? 0;
            const clamped = Math.min(next, estoqueDisp);
            const r = { ...prev };
            if (clamped === 0) delete r[id];
            else r[id] = clamped;
            return r;
        });
    }

    async function concluirPedido() {
        if (cartCount === 0 || submitting) return;
        setSubmitting(true);
        setMensagem("Enviando pedido...");

        try {
            // Atualiza estoque
            const novoStock = { ...stock };
            Object.entries(cart).forEach(([id, qty]) => {
                novoStock[id] = Math.max(0, (novoStock[id] ?? 0) - qty);
            });
            await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(novoStock));
            setStock(novoStock);

            // Gera número do pedido
            const numero =
                (orders.length > 0
                    ? Math.max(...orders.map((o) => o.numero))
                    : 10) + 1;

            const novoPedido = {
                numero,
                itens: Object.entries(cart).map(([id, qty]) => {
                    const item = MENU_ITEMS.find((i) => i.id === id);
                    return { name: item.name, qty, price: item.price };
                }),
                total,
                data: new Date().toLocaleString("pt-BR"),
                usuario: user?.email,
            };

            const novosOrders = [novoPedido, ...orders];
            await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(novosOrders));
            setOrders(novosOrders);
            setMeuNumero(numero);
            setCart({});
            setPagina("fila");
            setMensagem("Pedido concluído! Acompanhe sua posição na fila.");
        } catch (_) {
            setMensagem("Erro ao enviar pedido.");
        } finally {
            setSubmitting(false);
        }
    }

    // Professor: editar estoque
    function abrirEdicaoEstoque(item) {
        setEditItem(item);
        setEditValor(String(stock?.[item.id] ?? 0));
        setEditModal(true);
    }

    async function salvarEstoque() {
        const novoStock = {
            ...stock,
            [editItem.id]: Math.max(0, parseInt(editValor) || 0),
        };
        await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(novoStock));
        setStock(novoStock);
        setEditModal(false);
    }

    if (loading || stock === null) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color="#FF0C5C" />
            </View>
        );
    }

    const meusOrders = orders.filter((o) => o.usuario === user?.email);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Kitchenet</Text>
                    <Text style={styles.title}>{user?.unidade ?? ""}</Text>
                    <Text style={styles.subtitle}>
                        Faça seu pedido e acompanhe a fila
                    </Text>
                </View>

                {/* Abas */}
                <View style={[styles.tabs, { width: maxW }]}>
                    {["pedidos", "fila", "historico"].map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[
                                styles.tab,
                                pagina === p && styles.tabActive,
                            ]}
                            onPress={() => setPagina(p)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    pagina === p && styles.tabTextActive,
                                ]}
                            >
                                {p === "pedidos"
                                    ? "Pedido"
                                    : p === "fila"
                                      ? "Fila"
                                      : "Histórico"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── PEDIDOS ── */}
                {pagina === "pedidos" && (
                    <View style={{ width: maxW }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cardápio</Text>
                            <Text style={styles.sectionHint}>
                                {cartCount} item(ns)
                            </Text>
                        </View>

                        {MENU_ITEMS.map((item) => {
                            const qty = cart[item.id] || 0;
                            const estoqueOk = (stock[item.id] ?? 0) > 0;

                            return (
                                <View key={item.id} style={styles.card}>
                                    <View style={styles.rowBetween}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.itemPrice}>
                                                {formatBRL(item.price)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.stockText,
                                                    !estoqueOk &&
                                                        styles.stockVazio,
                                                ]}
                                            >
                                                {estoqueOk
                                                    ? `Estoque: ${stock[item.id]}`
                                                    : "Sem estoque"}
                                            </Text>
                                        </View>

                                        <View style={styles.qtyControls}>
                                            {isTeacher ? (
                                                // Professor vê botão de editar estoque
                                                <TouchableOpacity
                                                    style={styles.editBtn}
                                                    onPress={() =>
                                                        abrirEdicaoEstoque(item)
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.editBtnText
                                                        }
                                                    >
                                                        Editar estoque
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.qtyButton,
                                                            qty === 0 &&
                                                                styles.qtyButtonDisabled,
                                                        ]}
                                                        onPress={() =>
                                                            alterarQtd(
                                                                item.id,
                                                                -1,
                                                            )
                                                        }
                                                        disabled={qty === 0}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.qtyButtonText
                                                            }
                                                        >
                                                            -
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <View
                                                        style={styles.qtyBadge}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.qtyText
                                                            }
                                                        >
                                                            {qty}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.qtyButton,
                                                            !estoqueOk &&
                                                                styles.qtyButtonDisabled,
                                                        ]}
                                                        onPress={() =>
                                                            alterarQtd(
                                                                item.id,
                                                                +1,
                                                            )
                                                        }
                                                        disabled={!estoqueOk}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.qtyButtonText
                                                            }
                                                        >
                                                            +
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}

                        {!isTeacher && (
                            <View style={styles.summaryCard}>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.summaryLabel}>
                                        Total
                                    </Text>
                                    <Text style={styles.summaryValue}>
                                        {formatBRL(total)}
                                    </Text>
                                </View>
                                {!!mensagem && (
                                    <Text style={styles.feedback}>
                                        {mensagem}
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        (cartCount === 0 || submitting) &&
                                            styles.primaryButtonDisabled,
                                    ]}
                                    onPress={concluirPedido}
                                    disabled={cartCount === 0 || submitting}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {submitting
                                            ? "Carregando..."
                                            : "Concluir pedido"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ── FILA ── */}
                {pagina === "fila" && (
                    <View style={{ width: maxW }}>
                        <View style={styles.card}>
                            <Text style={styles.queueTitle}>
                                Fila de pedidos
                            </Text>
                            <View style={styles.queueGrid}>
                                <View style={styles.queueBox}>
                                    <Text style={styles.queueLabel}>
                                        Seu número
                                    </Text>
                                    <Text style={styles.queueNumber}>
                                        {meuNumero ?? "--"}
                                    </Text>
                                </View>
                                <View style={styles.queueBox}>
                                    <Text style={styles.queueLabel}>
                                        Total na fila
                                    </Text>
                                    <Text style={styles.queueNumber}>
                                        {orders.length}
                                    </Text>
                                </View>
                            </View>
                            {!!mensagem && (
                                <Text style={styles.feedback}>{mensagem}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => {
                                setPagina("pedidos");
                                setMeuNumero(null);
                                setMensagem("");
                            }}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Fazer novo pedido
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── HISTÓRICO ── */}
                {pagina === "historico" && (
                    <View style={{ width: maxW }}>
                        {meusOrders.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>
                                    Nenhum pedido ainda
                                </Text>
                                <Text style={styles.emptyText}>
                                    Seus pedidos aparecerão aqui.
                                </Text>
                            </View>
                        ) : (
                            meusOrders.map((o, i) => (
                                <View key={i} style={styles.card}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.itemName}>
                                            Pedido #{o.numero}
                                        </Text>
                                        <Text style={styles.itemPrice}>
                                            {formatBRL(o.total)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            color: "#999",
                                            fontSize: 12,
                                            marginTop: 2,
                                        }}
                                    >
                                        {o.data}
                                    </Text>
                                    {o.itens.map((it, j) => (
                                        <Text
                                            key={j}
                                            style={{
                                                color: "#444",
                                                fontSize: 13,
                                                marginTop: 4,
                                            }}
                                        >
                                            • {it.name} x{it.qty}
                                        </Text>
                                    ))}
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Modal edição de estoque */}
            <Modal visible={editModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>
                            Editar estoque — {editItem?.name}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editValor}
                            onChangeText={setEditValor}
                            keyboardType="numeric"
                            placeholder="Quantidade"
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setEditModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnSave}
                                onPress={salvarEstoque}
                            >
                                <Text style={styles.modalBtnSaveText}>
                                    Salvar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    scrollContent: {
        paddingBottom: 26,
        alignItems: "center",
        paddingHorizontal: 16,
    },
    header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 6,
    },
    subtitle: { color: "#666", fontSize: 14, textAlign: "center" },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 6,
        elevation: 2,
        marginBottom: 14,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    tabActive: { backgroundColor: "#FF0C5C" },
    tabText: { fontWeight: "bold", color: "#666" },
    tabTextActive: { color: "#fff" },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    sectionTitle: { fontSize: 18, fontWeight: "bold" },
    sectionHint: { fontSize: 12, color: "#666", fontWeight: "bold" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        elevation: 3,
        marginBottom: 12,
        width: "100%",
    },
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 18,
        elevation: 2,
        marginBottom: 12,
        alignItems: "center",
        width: "100%",
    },
    emptyTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
    emptyText: { color: "#666", textAlign: "center" },
    rowBetween: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    itemName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
    itemPrice: { color: "#FF0C5C", fontWeight: "bold" },
    stockText: { fontSize: 11, color: "#999", marginTop: 2 },
    stockVazio: { color: "#e53935" },
    editBtn: {
        backgroundColor: "#FF0C5C",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
    qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
    qtyButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#FF0C5C",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyButtonDisabled: { backgroundColor: "#ff7aa5" },
    qtyButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    qtyBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    qtyText: { fontWeight: "bold", color: "#111" },
    summaryCard: {
        marginTop: 4,
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        elevation: 3,
        width: "100%",
    },
    summaryLabel: { color: "#666", fontWeight: "bold" },
    summaryValue: { fontSize: 16, fontWeight: "bold", color: "#111" },
    feedback: {
        marginTop: 10,
        textAlign: "center",
        color: "#666",
        fontWeight: "bold",
    },
    primaryButton: {
        marginTop: 12,
        backgroundColor: "#FF0C5C",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    primaryButtonDisabled: { backgroundColor: "#ff7aa5" },
    primaryButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    queueTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 12,
    },
    queueGrid: { flexDirection: "row", gap: 12 },
    queueBox: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    queueLabel: { color: "#666", fontWeight: "bold", marginBottom: 8 },
    queueNumber: { fontSize: 26, fontWeight: "bold", color: "#FF0C5C" },
    secondaryButton: {
        marginTop: 12,
        backgroundColor: "#111",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        width: "100%",
    },
    secondaryButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modal: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#171717",
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 16,
    },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalBtnCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
    },
    modalBtnCancelText: { fontWeight: "bold", color: "#666" },
    modalBtnSave: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "#FF0C5C",
        alignItems: "center",
    },
    modalBtnSaveText: { fontWeight: "bold", color: "#fff" },
});
