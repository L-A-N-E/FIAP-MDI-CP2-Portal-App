import { Calendar } from "react-native-calendars";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const EVENTS_KEY = "fiap_calendar_events";

export default function CalendarScreen() {
    const { user } = useAuth();
    const { colors, dark } = useTheme();
    const isTeacher = user?.role === "teacher";

    const [selected, setSelected] = useState("");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modal, setModal] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [materia, setMateria] = useState("");
    const [saving, setSaving] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        async function load() {
            try {
                const json = await SecureStore.getItemAsync(EVENTS_KEY);
                if (json) setEvents(JSON.parse(json));
            } catch (_) {
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const formatToCalendar = (dateBR) => {
        const [d, m, y] = dateBR.split("/");
        return `${y}-${m}-${d}`;
    };

    const markedDates = events.reduce((acc, ev) => {
        const key = formatToCalendar(ev.date);
        acc[key] = { marked: true, dotColor: "#FF0C5C" };
        return acc;
    }, {});

    const eventsToday = events.filter(
        (ev) => formatToCalendar(ev.date) === selected,
    );

    async function salvarEvento() {
        const novosErros = {};
        if (!titulo.trim()) novosErros.titulo = "O título é obrigatório.";
        if (!materia.trim()) novosErros.materia = "A matéria é obrigatória.";
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

        setSaving(true);
        try {
            const novoEvento = {
                id: `${Date.now()}-${Math.random()}`,
                title: titulo.trim(),
                subject: materia.trim(),
                date: selected.split("-").reverse().join("/"),
                addedBy: user?.email,
            };
            const novosEvents = [...events, novoEvento];
            await SecureStore.setItemAsync(
                EVENTS_KEY,
                JSON.stringify(novosEvents),
            );
            setEvents(novosEvents);
            setTitulo("");
            setMateria("");
            setModal(false);
        } catch (_) {
            Alert.alert("Erro", "Não foi possível salvar o evento.");
        } finally {
            setSaving(false);
        }
    }

    async function removerEvento(id) {
        const novosEvents = events.filter((ev) => ev.id !== id);
        await SecureStore.setItemAsync(EVENTS_KEY, JSON.stringify(novosEvents));
        setEvents(novosEvents);
    }

    const calBg = dark ? colors.bg : colors.card;

    const s = makeStyles(colors, calBg);

    if (loading) {
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

    return (
        <ScrollView style={s.container}>
            <View style={s.header}>
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={s.logo}
                    resizeMode="contain"
                />
                <Text style={s.title}>Calendário Acadêmico</Text>
            </View>

            <View style={s.calendarContainer}>
                <View style={s.calendarStyle}>
                    <Calendar
                        key={dark ? "dark" : "light"}
                        onDayPress={(day) => setSelected(day.dateString)}
                        markedDates={{
                            ...markedDates,
                            [selected]: {
                                ...(markedDates[selected] || {}),
                                selected: true,
                                selectedColor: "#FF0C5C",
                            },
                        }}
                        theme={{
                            todayTextColor: "#FF0C5C",
                            arrowColor: "#FF0C5C",
                            selectedDayBackgroundColor: "#FF0C5C",
                            dotColor: "#FF0C5C",
                            backgroundColor: calBg,
                            calendarBackground: calBg,
                            textSectionTitleColor: colors.textSecondary,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.textMuted,
                            monthTextColor: colors.text,
                        }}
                    />
                </View>
            </View>

            {isTeacher && selected !== "" && (
                <View style={s.addContainer}>
                    <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => setModal(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.addBtnText}>Adicionar evento</Text>
                    </TouchableOpacity>
                </View>
            )}

            {selected !== "" && (
                <View style={s.eventContainer}>
                    <View style={s.eventCard}>
                        <Text style={s.eventTitle}>
                            Eventos — {selected.split("-").reverse().join("/")}
                        </Text>

                        {eventsToday.length === 0 ? (
                            <Text style={s.eventMessage}>
                                Nenhum evento nesta data.
                            </Text>
                        ) : (
                            eventsToday.map((ev) => (
                                <View key={ev.id} style={s.eventRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.eventNome}>
                                            {ev.title}
                                        </Text>
                                        <Text style={s.eventMateria}>
                                            {ev.subject}
                                        </Text>
                                    </View>
                                    {isTeacher &&
                                        ev.addedBy === user?.email && (
                                            <TouchableOpacity
                                                onPress={() =>
                                                    removerEvento(ev.id)
                                                }
                                                hitSlop={{
                                                    top: 8,
                                                    bottom: 8,
                                                    left: 8,
                                                    right: 8,
                                                }}
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={18}
                                                    color="#e53935"
                                                />
                                            </TouchableOpacity>
                                        )}
                                </View>
                            ))
                        )}
                    </View>
                </View>
            )}

            <Modal visible={modal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <Text style={s.modalTitle}>
                            Novo evento —{" "}
                            {selected.split("-").reverse().join("/")}
                        </Text>

                        <Text style={s.modalLabel}>Título</Text>
                        <TextInput
                            style={[
                                s.modalInput,
                                erros.titulo && s.modalInputErro,
                            ]}
                            placeholder="Ex: Checkpoint 1"
                            placeholderTextColor={colors.textMuted}
                            value={titulo}
                            onChangeText={(v) => {
                                setTitulo(v);
                                setErros((p) => ({ ...p, titulo: undefined }));
                            }}
                        />
                        <Text style={s.erroInline}>{erros.titulo ?? " "}</Text>

                        <Text style={s.modalLabel}>Matéria</Text>
                        <TextInput
                            style={[
                                s.modalInput,
                                erros.materia && s.modalInputErro,
                            ]}
                            placeholder="Ex: Mobile Development & IoT"
                            placeholderTextColor={colors.textMuted}
                            value={materia}
                            onChangeText={(v) => {
                                setMateria(v);
                                setErros((p) => ({ ...p, materia: undefined }));
                            }}
                        />
                        <Text style={s.erroInline}>{erros.materia ?? " "}</Text>

                        <View style={s.modalBtns}>
                            <TouchableOpacity
                                style={s.modalBtnCancel}
                                onPress={() => setModal(false)}
                            >
                                <Text style={s.modalBtnCancelText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.modalBtnSave}
                                onPress={salvarEvento}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={s.modalBtnSaveText}>
                                        Salvar
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function makeStyles(c, calBg) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.bg },
        header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
        logo: { width: 140, height: 60 },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 8,
            color: c.text,
        },
        calendarContainer: { flexDirection: "row", justifyContent: "center" },
        calendarStyle: {
            padding: 20,
            borderRadius: 20,
            width: "90%",
            backgroundColor: calBg,
        },
        addContainer: {
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 12,
        },
        addBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#FF0C5C",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
        },
        addBtnText: { color: "#fff", fontWeight: "bold" },
        eventContainer: {
            marginTop: 16,
            flexDirection: "row",
            justifyContent: "center",
            paddingBottom: 24,
        },
        eventCard: {
            width: "90%",
            padding: 20,
            borderRadius: 14,
            backgroundColor: c.card,
            elevation: 3,
        },
        eventTitle: {
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 12,
            textAlign: "center",
            color: c.text,
        },
        eventRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: c.separator,
        },
        eventNome: { fontSize: 14, fontWeight: "bold", color: c.text },
        eventMateria: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
        eventMessage: { textAlign: "center", color: c.textSecondary },
        modalOverlay: {
            flex: 1,
            backgroundColor: c.overlay,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
        },
        modal: {
            width: "100%",
            backgroundColor: c.card,
            borderRadius: 16,
            padding: 20,
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 16,
            color: c.text,
        },
        modalLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: c.text,
            marginBottom: 6,
        },
        modalInput: {
            borderWidth: 1,
            borderColor: c.inputBorder,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            backgroundColor: c.inputBg,
            color: c.text,
        },
        modalInputErro: { borderColor: "#e53935" },
        erroInline: {
            color: "#e53935",
            fontSize: 12,
            marginTop: 4,
            minHeight: 18,
        },
        modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
        modalBtnCancel: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.inputBorder,
            alignItems: "center",
        },
        modalBtnCancelText: { fontWeight: "bold", color: c.textSecondary },
        modalBtnSave: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: "#FF0C5C",
            alignItems: "center",
        },
        modalBtnSaveText: { fontWeight: "bold", color: "#fff" },
    });
}
