import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const BULLETIN_KEY = "@fiap_bulletin";

// Matérias fixas
const SUBJECTS = [
    "Arquitetura Orientada a Serviços (SOA) e Web Services",
    "C# Software Development",
    "Cybersecurity",
    "Inteligência Artificial & Machine Learning",
    "Mobile Development & IoT",
    "Operating Systems",
    "Physical Computing: IoT & IOB",
    "Testing, Compliance & Quality Assurance",
];

const DEFAULT_GRADES = {
    cp1: "-",
    gs1: "-",
    fa1: "-",
    cp2: "-",
    gs2: "-",
    fa2: "-",
    aulas: "80",
    pr: "100",
};

export default function Bulletin() {
    const { user } = useAuth();
    const isTeacher = user?.role === "teacher";

    const [grades, setGrades] = useState(null); // { subjectKey: { cp1, gs1, ... } }
    const [loading, setLoading] = useState(true);

    // modal de edição
    const [modal, setModal] = useState(false);
    const [editSubject, setEditSubject] = useState(null);
    const [editField, setEditField] = useState(null);
    const [editValor, setEditValor] = useState("");
    const [saving, setSaving] = useState(false);

    // modal de detalhe (aluno)
    const [modalVisible, setModalVisible] = useState(false);
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const json = await AsyncStorage.getItem(BULLETIN_KEY);
                if (json) {
                    setGrades(JSON.parse(json));
                } else {
                    const inicial = {};
                    SUBJECTS.forEach((s) => {
                        inicial[s] = { ...DEFAULT_GRADES };
                    });
                    await AsyncStorage.setItem(
                        BULLETIN_KEY,
                        JSON.stringify(inicial),
                    );
                    setGrades(inicial);
                }
            } catch (_) {
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function salvarNota() {
        setSaving(true);
        try {
            const novoGrades = {
                ...grades,
                [editSubject]: {
                    ...grades[editSubject],
                    [editField]: editValor.trim() || "-",
                },
            };
            await AsyncStorage.setItem(
                BULLETIN_KEY,
                JSON.stringify(novoGrades),
            );
            setGrades(novoGrades);
            setModal(false);
        } catch (_) {
        } finally {
            setSaving(false);
        }
    }

    function abrirEdicao(subject, field, valorAtual) {
        setEditSubject(subject);
        setEditField(field);
        setEditValor(valorAtual === "-" ? "" : valorAtual);
        setModal(true);
    }

    function abrirDetalhe(title, subject, field) {
        const valor = grades?.[subject]?.[field] ?? "-";
        setDetail({ title, valor, subject });
        setModalVisible(true);
    }

    const FIELD_LABELS = {
        cp1: "CP 1º Sem",
        gs1: "GS 1º Sem",
        fa1: "FA 1º Sem",
        cp2: "CP 2º Sem",
        gs2: "GS 2º Sem",
        fa2: "FA 2º Sem",
        aulas: "Aulas",
        pr: "Presença (%)",
    };

    if (loading || grades === null) {
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

    return (
        <View style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>
                    {user?.class || (isTeacher ? "Professor" : "Turma")} — 2026
                </Text>
                <Text style={styles.subtitle}>
                    Boletim Acadêmico{isTeacher ? " (modo edição)" : ""}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalContent}
            >
                <View style={styles.tableCard}>
                    {/* Cabeçalho superior */}
                    <View style={styles.headerTopRow}>
                        <View
                            style={[styles.headerTopCell, styles.subjectHeader]}
                        >
                            <Text style={styles.headerTopCellText}></Text>
                        </View>
                        <View style={styles.groupBlock}>
                            <Text style={styles.groupTitle}>1º SEMESTRE</Text>
                        </View>
                        <View style={styles.groupBlock}>
                            <Text style={styles.groupTitle}>2º SEMESTRE</Text>
                        </View>
                        <View style={styles.resultGroup}>
                            <Text style={styles.groupTitle}>RESULTADO</Text>
                        </View>
                    </View>

                    {/* Subcabeçalho */}
                    <View style={styles.headerBottomRow}>
                        <View
                            style={[
                                styles.headerBottomCell,
                                styles.subjectHeader,
                                styles.headerLabelContainer,
                            ]}
                        >
                            <Text style={styles.headerLabelText}>
                                DISCIPLINA
                            </Text>
                            <Text style={styles.headerLabelText}>\</Text>
                            <Text style={styles.headerLabelText}>
                                CATEGORIA
                            </Text>
                        </View>
                        {["CP", "GS", "FA", "MD", "CP", "GS", "FA", "MD"].map(
                            (h, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.headerBottomCell,
                                        h === "GS" && styles.headerGreen,
                                        h === "MD" && styles.headerPink,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.headerBottomCellText,
                                            h === "GS" &&
                                                styles.headerGreenText,
                                            h === "MD" && styles.headerPinkText,
                                        ]}
                                    >
                                        {h}
                                    </Text>
                                </View>
                            ),
                        )}
                        <View style={styles.headerBottomCell}>
                            <Text style={styles.headerBottomCellText}>
                                AULAS
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.headerBottomCell,
                                styles.headerMuted,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.headerBottomCellText,
                                    styles.headerMutedText,
                                ]}
                            >
                                PR(%)
                            </Text>
                        </View>
                        <View style={styles.headerBottomCell}>
                            <Text style={styles.headerBottomCellText}>MP</Text>
                        </View>
                        <View style={styles.headerBottomCell}>
                            <Text style={styles.headerBottomCellText}>EXA</Text>
                        </View>
                        <View
                            style={[styles.headerBottomCell, styles.headerPink]}
                        >
                            <Text
                                style={[
                                    styles.headerBottomCellText,
                                    styles.headerPinkText,
                                ]}
                            >
                                MF
                            </Text>
                        </View>
                        <View style={styles.situationHeader}>
                            <Text style={styles.headerBottomCellText}>
                                SITUAÇÃO
                            </Text>
                        </View>
                    </View>

                    {/* Linhas */}
                    <ScrollView style={styles.bodyScroll}>
                        {SUBJECTS.map((subject, index) => {
                            const g = grades[subject] || DEFAULT_GRADES;

                            function Celula({ field, cor }) {
                                const val = g[field] ?? "-";
                                return (
                                    <TouchableOpacity
                                        style={styles.bodyCell}
                                        onPress={() =>
                                            isTeacher
                                                ? abrirEdicao(
                                                      subject,
                                                      field,
                                                      val,
                                                  )
                                                : abrirDetalhe(
                                                      FIELD_LABELS[field],
                                                      subject,
                                                      field,
                                                  )
                                        }
                                        activeOpacity={0.6}
                                    >
                                        <View style={styles.badge}>
                                            <Text
                                                style={[
                                                    styles.cellText,
                                                    cor && { color: cor },
                                                    val === "-" && styles.empty,
                                                ]}
                                            >
                                                {val}
                                            </Text>
                                            {isTeacher && (
                                                <Ionicons
                                                    name="create-outline"
                                                    size={10}
                                                    color="#FF0C5C"
                                                    style={styles.icon}
                                                />
                                            )}
                                            {!isTeacher && (
                                                <Ionicons
                                                    name="add"
                                                    size={12}
                                                    color="#FF0C5C"
                                                    style={styles.icon}
                                                />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <View key={index} style={styles.row}>
                                    <View
                                        style={[
                                            styles.bodyCell,
                                            styles.subjectCell,
                                        ]}
                                    >
                                        <Text
                                            style={styles.subjectCellText}
                                            numberOfLines={2}
                                        >
                                            {subject}
                                        </Text>
                                    </View>
                                    <Celula field="cp1" />
                                    <Celula field="gs1" cor="#039855" />
                                    <Celula field="fa1" />
                                    <View style={styles.bodyCell}>
                                        <Text style={styles.cellText}>-</Text>
                                    </View>
                                    <Celula field="cp2" />
                                    <Celula field="gs2" cor="#039855" />
                                    <Celula field="fa2" />
                                    <View style={styles.bodyCell}>
                                        <Text style={styles.cellText}>-</Text>
                                    </View>
                                    <Celula field="aulas" />
                                    <Celula field="pr" />
                                    <View style={styles.bodyCell}>
                                        <Text style={styles.cellText}>-</Text>
                                    </View>
                                    <View style={styles.bodyCell}>
                                        <Text style={styles.cellText}>-</Text>
                                    </View>
                                    <View style={styles.bodyCell}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                styles.headerPink,
                                            ]}
                                        >
                                            -
                                        </Text>
                                    </View>
                                    <View style={styles.bodyCell}>
                                        <Text style={styles.cellText}>-</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Modal edição (professor) */}
            <Modal visible={modal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>
                            Editar — {FIELD_LABELS[editField]}
                        </Text>
                        <Text style={styles.modalSubtitle} numberOfLines={2}>
                            {editSubject}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editValor}
                            onChangeText={setEditValor}
                            placeholder="Ex: 7.5"
                            keyboardType="default"
                            autoFocus
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnSave}
                                onPress={salvarNota}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.modalBtnSaveText}>
                                        Salvar
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal detalhe (aluno) */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {detail?.title}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color="#FF0C5C"
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle} numberOfLines={2}>
                            {detail?.subject}
                        </Text>
                        <Text style={styles.detalheValor}>
                            {detail?.valor ?? "-"}
                        </Text>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F6FA", paddingTop: 18 },
    pageHeader: { paddingHorizontal: 14, marginBottom: 10 },
    title: { fontSize: 22, fontWeight: "bold", color: "#101828" },
    subtitle: { fontSize: 13, marginTop: 2, color: "#667085" },
    horizontalContent: { paddingHorizontal: 12, paddingBottom: 20 },
    tableCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E7EAF0",
        overflow: "hidden",
    },
    headerTopRow: {
        flexDirection: "row",
        backgroundColor: "#FAFBFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E7EAF0",
    },
    headerTopCell: {
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTopCellText: {
        fontWeight: "700",
        color: "#391d1d",
        fontSize: 12,
        textAlign: "center",
    },
    subjectHeader: {
        width: 240,
        paddingHorizontal: 14,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    headerLabelContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 38,
    },
    headerLabelText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#344054",
    },
    groupBlock: {
        width: 208,
        borderLeftWidth: 1,
        borderLeftColor: "#E7EAF0",
        justifyContent: "center",
        alignItems: "center",
    },
    resultGroup: {
        width: 304,
        borderLeftWidth: 1,
        borderLeftColor: "#E7EAF0",
        justifyContent: "center",
        alignItems: "center",
    },
    groupTitle: { fontSize: 12, fontWeight: "700", color: "#1D2939" },
    headerBottomRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E7EAF0",
    },
    headerBottomCell: {
        width: 52,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#F0F2F7",
    },
    headerBottomCellText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#344054",
        textAlign: "center",
    },
    situationHeader: {
        width: 96,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#F0F2F7",
    },
    headerGreen: {},
    headerGreenText: { color: "#039855" },
    headerPink: {},
    headerPinkText: { color: "#FF0C5C" },
    headerMuted: {},
    headerMutedText: { color: "#98A2B3" },
    bodyScroll: { maxHeight: 520 },
    row: {
        flexDirection: "row",
        minHeight: 66,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F2F7",
        backgroundColor: "#fff",
    },
    bodyCell: {
        width: 52,
        justifyContent: "center",
        alignItems: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#F7F8FB",
    },
    subjectCell: {
        width: 240,
        paddingHorizontal: 14,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    subjectCellText: {
        fontWeight: "500",
        color: "#1D2939",
        fontSize: 13,
        lineHeight: 18,
        textAlign: "left",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 4,
        paddingVertical: 5,
        borderRadius: 999,
        minWidth: 38,
    },
    icon: { marginLeft: 2 },
    cellText: { fontSize: 12, fontWeight: "600", color: "#344054" },
    empty: { color: "#98A2B3" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(16,24,40,0.35)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 18,
    },
    modal: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#EAECF0",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: { fontSize: 16, fontWeight: "bold", color: "#101828", flex: 1 },
    modalSubtitle: {
        fontSize: 12,
        color: "#667085",
        marginTop: 4,
        marginBottom: 14,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 8,
    },
    modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
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
    detalheValor: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FF0C5C",
        textAlign: "center",
        marginVertical: 16,
    },
    closeBtn: {
        marginTop: 8,
        backgroundColor: "#FF0C5C",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    closeText: { color: "#fff", fontWeight: "bold" },
});
