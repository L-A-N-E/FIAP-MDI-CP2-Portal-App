import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

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

const STOCK_KEY = "fiap_canteen_stock";
const ORDERS_KEY = "fiap_canteen_orders";

const { width } = Dimensions.get("window");
const maxW = Math.min(width - 32, 460);

export default function Canteen() {
    const { user } = useAuth();
    const { colors } = useTheme();

    const [stock, setStock] = useState(null);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState({});
    const [pagina, setPagina] = useState("pedidos");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [meuNumero, setMeuNumero] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const sJson = await SecureStore.getItemAsync(STOCK_KEY);
                if (sJson) {
                    setStock(JSON.parse(sJson));
                } else {
                    const inicial = {};
                    MENU_ITEMS.forEach((i) => {
                        inicial[i.id] = i.defaultStock;
                    });
                    await SecureStore.setItemAsync(
                        STOCK_KEY,
                        JSON.stringify(inicial),
                    );
                    setStock(inicial);
                }
                const oJson = await SecureStore.getItemAsync(ORDERS_KEY);
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
            const novoStock = { ...stock };
            Object.entries(cart).forEach(([id, qty]) => {
                novoStock[id] = Math.max(0, (novoStock[id] ?? 0) - qty);
            });
            await SecureStore.setItemAsync(
                STOCK_KEY,
                JSON.stringify(novoStock),
            );
            setStock(novoStock);

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
            await SecureStore.setItemAsync(
                ORDERS_KEY,
                JSON.stringify(novosOrders),
            );
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

    const s = makeStyles(colors);

    if (loading || stock === null) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.bg,
                }}
            >
                <ActivityIndicator size="large" color="#FF0C5C" />
            </View>
        );
    }

    const meusOrders = orders.filter((o) => o.usuario === user?.email);

    return (
        <View style={s.container}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.header}>
                    <Text style={s.title}>Kitchenet</Text>
                    <Text style={s.title}>{user?.unidade ?? ""}</Text>
                    <Text style={s.subtitle}>
                        Faça seu pedido e acompanhe a fila
                    </Text>
                </View>

                <View style={[s.tabs, { width: maxW }]}>
                    {["pedidos", "fila", "historico"].map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[s.tab, pagina === p && s.tabActive]}
                            onPress={() => setPagina(p)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    s.tabText,
                                    pagina === p && s.tabTextActive,
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

                {pagina === "pedidos" && (
                    <View style={{ width: maxW }}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Cardápio</Text>
                            <Text style={s.sectionHint}>
                                {cartCount} item(ns)
                            </Text>
                        </View>

                        {MENU_ITEMS.map((item) => {
                            const qty = cart[item.id] || 0;
                            const estoqueOk = (stock[item.id] ?? 0) > 0;
                            return (
                                <View key={item.id} style={s.card}>
                                    <View style={s.rowBetween}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.itemName}>
                                                {item.name}
                                            </Text>
                                            <Text style={s.itemPrice}>
                                                {formatBRL(item.price)}
                                            </Text>
                                            <Text
                                                style={[
                                                    s.stockText,
                                                    !estoqueOk && s.stockVazio,
                                                ]}
                                            >
                                                {estoqueOk
                                                    ? `Estoque: ${stock[item.id]}`
                                                    : "Sem estoque"}
                                            </Text>
                                        </View>
                                        <View style={s.qtyControls}>
                                            <>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.qtyButton,
                                                            qty === 0 &&
                                                                s.qtyButtonDisabled,
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
                                                                s.qtyButtonText
                                                            }
                                                        >
                                                            -
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <View style={s.qtyBadge}>
                                                        <Text style={s.qtyText}>
                                                            {qty}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={[
                                                            s.qtyButton,
                                                            !estoqueOk &&
                                                                s.qtyButtonDisabled,
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
                                                                s.qtyButtonText
                                                            }
                                                        >
                                                            +
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}

                        <View style={s.summaryCard}>
                                <View style={s.rowBetween}>
                                    <Text style={s.summaryLabel}>Total</Text>
                                    <Text style={s.summaryValue}>
                                        {formatBRL(total)}
                                    </Text>
                                </View>
                                {!!mensagem && (
                                    <Text style={s.feedback}>{mensagem}</Text>
                                )}
                                <TouchableOpacity
                                    style={[
                                        s.primaryButton,
                                        (cartCount === 0 || submitting) &&
                                            s.primaryButtonDisabled,
                                    ]}
                                    onPress={concluirPedido}
                                    disabled={cartCount === 0 || submitting}
                                >
                                    <Text style={s.primaryButtonText}>
                                        {submitting
                                            ? "Carregando..."
                                            : "Concluir pedido"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                    </View>
                )}

                {pagina === "fila" && (
                    <View style={{ width: maxW }}>
                        <View style={s.card}>
                            <Text style={s.queueTitle}>Fila de pedidos</Text>
                            <View style={s.queueGrid}>
                                <View style={s.queueBox}>
                                    <Text style={s.queueLabel}>Seu número</Text>
                                    <Text style={s.queueNumber}>
                                        {meuNumero ?? "--"}
                                    </Text>
                                </View>
                                <View style={s.queueBox}>
                                    <Text style={s.queueLabel}>
                                        Total na fila
                                    </Text>
                                    <Text style={s.queueNumber}>
                                        {orders.length}
                                    </Text>
                                </View>
                            </View>
                            {!!mensagem && (
                                <Text style={s.feedback}>{mensagem}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={s.secondaryButton}
                            onPress={() => {
                                setPagina("pedidos");
                                setMeuNumero(null);
                                setMensagem("");
                            }}
                        >
                            <Text style={s.secondaryButtonText}>
                                Fazer novo pedido
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {pagina === "historico" && (
                    <View style={{ width: maxW }}>
                        {meusOrders.length === 0 ? (
                            <View style={s.emptyCard}>
                                <Text style={s.emptyTitle}>
                                    Nenhum pedido ainda
                                </Text>
                                <Text style={s.emptyText}>
                                    Seus pedidos aparecerão aqui.
                                </Text>
                            </View>
                        ) : (
                            meusOrders.map((o, i) => (
                                <View key={i} style={s.card}>
                                    <View style={s.rowBetween}>
                                        <Text style={s.itemName}>
                                            Pedido #{o.numero}
                                        </Text>
                                        <Text style={s.itemPrice}>
                                            {formatBRL(o.total)}
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            color: colors.textMuted,
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
                                                color: colors.textSecondary,
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

        </View>
    );
}

function makeStyles(c) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.bg },
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
            color: c.text,
        },
        subtitle: { color: c.textSecondary, fontSize: 14, textAlign: "center" },
        tabs: {
            flexDirection: "row",
            backgroundColor: c.tabBg,
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
        tabText: { fontWeight: "bold", color: c.textSecondary },
        tabTextActive: { color: "#fff" },
        sectionHeader: {
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 10,
            paddingHorizontal: 2,
        },
        sectionTitle: { fontSize: 18, fontWeight: "bold", color: c.text },
        sectionHint: {
            fontSize: 12,
            color: c.textSecondary,
            fontWeight: "bold",
        },
        card: {
            backgroundColor: c.card,
            borderRadius: 14,
            padding: 16,
            elevation: 3,
            marginBottom: 12,
            width: "100%",
        },
        emptyCard: {
            backgroundColor: c.card,
            borderRadius: 14,
            padding: 18,
            elevation: 2,
            marginBottom: 12,
            alignItems: "center",
            width: "100%",
        },
        emptyTitle: {
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 6,
            color: c.text,
        },
        emptyText: { color: c.textSecondary, textAlign: "center" },
        rowBetween: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        itemName: {
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 4,
            color: c.text,
        },
        itemPrice: { color: "#FF0C5C", fontWeight: "bold" },
        stockText: { fontSize: 11, color: c.textMuted, marginTop: 2 },
        stockVazio: { color: "#e53935" },
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
            backgroundColor: c.badgeBg,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 8,
        },
        qtyText: { fontWeight: "bold", color: c.text },
        summaryCard: {
            marginTop: 4,
            backgroundColor: c.card,
            borderRadius: 14,
            padding: 16,
            elevation: 3,
            width: "100%",
        },
        summaryLabel: { color: c.textSecondary, fontWeight: "bold" },
        summaryValue: { fontSize: 16, fontWeight: "bold", color: c.text },
        feedback: {
            marginTop: 10,
            textAlign: "center",
            color: c.textSecondary,
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
            color: c.text,
        },
        queueGrid: { flexDirection: "row", gap: 12 },
        queueBox: {
            flex: 1,
            backgroundColor: c.queueBoxBg,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
        },
        queueLabel: {
            color: c.textSecondary,
            fontWeight: "bold",
            marginBottom: 8,
        },
        queueNumber: { fontSize: 26, fontWeight: "bold", color: "#FF0C5C" },
        secondaryButton: {
            marginTop: 12,
            backgroundColor: c.secondaryBtn,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            width: "100%",
        },
        secondaryButtonText: {
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
        },
    });
}