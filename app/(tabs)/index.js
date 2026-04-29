import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import Swiper from "react-native-swiper";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { classroom } from "../../data/classroom.data";

const EVENTS_KEY = "@fiap_calendar_events";

export default function Home() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const json = await AsyncStorage.getItem(EVENTS_KEY);
                if (json) setEvents(JSON.parse(json));
            } catch (_) {
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const todayDate = new Date().getDay();
    const todayDateFormatted = new Date().toLocaleDateString("pt-BR");

    const weekDays = [
        "domingo",
        "segunda",
        "terça",
        "quarta",
        "quinta",
        "sexta",
        "sábado",
    ];
    const todayName = weekDays[todayDate];
    const normalize = (t) => t.toLowerCase().replace("-feira", "").trim();

    const startIndex = (() => {
        const i = classroom.findIndex((d) => normalize(d.name) === todayName);
        return i !== -1 ? i : 0;
    })();

    const orderedDays = [
        ...classroom.slice(startIndex),
        ...classroom.slice(0, startIndex),
    ];

    // Próximos eventos (ordenados por data, máx 3)
    const parseDate = (dateBR) => {
        const [d, m, y] = dateBR.split("/");
        return new Date(y, m - 1, d);
    };

    const upcomingEvents = [...events]
        .filter(
            (ev) =>
                parseDate(ev.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
        )
        .sort((a, b) => parseDate(a.date) - parseDate(b.date))
        .slice(0, 3);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require("../../assets/FIAP.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.welcome}>
                    Bem-vindo, {user?.name ?? ""}
                </Text>
                <Text style={styles.subtitle}>
                    Confira suas aulas e próximos eventos
                </Text>
            </View>

            <View style={styles.swiperContainer}>
                <Swiper
                    loop={false}
                    showsPagination
                    dotColor="#ddd"
                    activeDotColor="#FF0C5C"
                >
                    {orderedDays.map((day, i) => (
                        <View key={i} style={styles.slide}>
                            <View style={styles.dayHeader}>
                                <Text style={styles.day}>{day.name}</Text>
                                {i === 0 && (
                                    <View style={styles.todayBadge}>
                                        <Text style={styles.todayText}>
                                            HOJE
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.classTitle}>1ª Aula</Text>
                                <Text style={styles.classTextTime}>
                                    {day.time[0]}
                                </Text>
                                <View style={styles.classClassroom}>
                                    <Text style={styles.classText}>
                                        {day.classes[0]}
                                    </Text>
                                    <Text style={styles.classTextClassroom}>
                                        - {day.classroom[0]}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.classTitle}>2ª Aula</Text>
                                <Text style={styles.classTextTime}>
                                    {day.time[1]}
                                </Text>
                                <View style={styles.classClassroom}>
                                    <Text style={styles.classText}>
                                        {day.classes[1]}
                                    </Text>
                                    <Text style={styles.classTextClassroom}>
                                        - {day.classroom[1]}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </Swiper>
            </View>

            <View style={styles.sprintContainer}>
                <View style={styles.sprintCard}>
                    <View style={styles.sprintHeader}>
                        <Text style={styles.sprintTitle}>Próximos Eventos</Text>
                        <Text style={styles.todayDate}>
                            {todayDateFormatted}
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator
                            color="#FF0C5C"
                            style={{ marginVertical: 12 }}
                        />
                    ) : upcomingEvents.length === 0 ? (
                        <Text style={styles.emptyText}>
                            Nenhum evento agendado.
                        </Text>
                    ) : (
                        upcomingEvents.map((ev, i) => (
                            <View key={i} style={styles.deliveryRow}>
                                <View style={styles.dot} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.deliveryTitle}>
                                        {ev.title}
                                    </Text>
                                    <Text style={styles.deliverySubject}>
                                        {ev.subject}
                                    </Text>
                                </View>
                                <Text style={styles.deliveryDate}>
                                    {ev.date}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
    logo: { width: 140, height: 60 },
    welcome: { fontSize: 24, fontWeight: "bold", marginTop: 10 },
    subtitle: { color: "#666", fontSize: 14 },
    swiperContainer: { height: 350 },
    slide: { alignItems: "center", padding: 20 },
    dayHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    day: { fontSize: 22, fontWeight: "bold", marginRight: 10 },
    todayBadge: {
        backgroundColor: "#FF0C5C",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    todayText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
    card: {
        width: "100%",
        height: 100,
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        borderRadius: 14,
        marginBottom: 12,
        elevation: 3,
    },
    classTitle: { fontWeight: "bold", marginBottom: 5, color: "#FF0C5C" },
    classClassroom: { flexDirection: "row", gap: 10, alignItems: "center" },
    classTextTime: {
        color: "#171717",
        fontSize: 16,
        paddingBottom: 4,
        fontWeight: "bold",
    },
    classTextClassroom: { fontSize: 12, color: "#FF0C5C" },
    classText: { color: "#444" },
    sprintContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 24,
    },
    sprintCard: {
        width: "90%",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 14,
        elevation: 3,
    },
    sprintHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    todayDate: { fontSize: 14, color: "#171717" },
    sprintTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
    emptyText: { color: "#999", textAlign: "center", paddingVertical: 12 },
    deliveryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingVertical: 6,
    },
    deliveryTitle: { fontWeight: "bold", fontSize: 13 },
    deliverySubject: { fontSize: 12, color: "#666" },
    deliveryDate: { fontSize: 12, color: "#FF0C5C", fontWeight: "bold" },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF0C5C",
        marginRight: 8,
    },
});
