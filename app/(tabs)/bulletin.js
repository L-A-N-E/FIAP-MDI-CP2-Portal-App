import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Modal,
    TextInput,
    ActivityIndicator,
    FlatList,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

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

const TOTAL_AULAS = 80;

const DEFAULT_GRADES = {
    cp1: "-",
    cp2: "-",
    cp3: "-",
    gs1: "-",
    fa1: "-",
    gs2: "-",
    fa2: "-",
    faltas: "0",
};

const FIELD_LABELS = {
    cp1: "CP1",
    cp2: "CP2",
    cp3: "CP3",
    gs1: "GS 1º Sem",
    fa1: "FA 1º Sem",
    gs2: "GS 2º Sem",
    fa2: "FA 2º Sem",
    faltas: "Faltas",
};

// Chave de boletim isolada por aluno
function bulletinKey(email) {
    const safe = (email ?? "guest").replace(/[^a-zA-Z0-9_.]/g, "_");
    return `fiap_bulletin_${safe}`;
}

function initGrades() {
    const g = {};
    SUBJECTS.forEach((s) => {
        g[s] = { ...DEFAULT_GRADES };
    });
    return g;
}

export default function Bulletin() {
    const { user, getAllStudents } = useAuth();
    const { colors } = useTheme();
    const isTeacher = user?.role === "teacher";

    // Aluno cujo boletim está sendo exibido/editado
    const [targetEmail, setTargetEmail] = useState(
        isTeacher ? null : user?.email,
    );

    // Lista de alunos (professor)
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentModal, setStudentModal] = useState(false);

    const [grades, setGrades] = useState(null);
    const [loading, setLoading] = useState(false);

    // modal de edição
    const [modal, setModal] = useState(false);
    const [editSubject, setEditSubject] = useState(null);
    const [editField, setEditField] = useState(null);
    const [editValor, setEditValor] = useState("");
    const [saving, setSaving] = useState(false);

    // modal CP (professor edita CP1a/CP1b/CP1c; aluno vê)
    const [cpModal, setCpModal] = useState(false);
    const [cpSubject, setCpSubject] = useState(null);

    const [cpVals, setCpVals] = useState({ 1: "", 2: "", 3: "" });
    const [savingCp, setSavingCp] = useState(false);

    // modal detalhe (aluno)
    const [modalVisible, setModalVisible] = useState(false);
    const [detail, setDetail] = useState(null);

    // ── Carrega alunos quando professor abre ────────────────────────────────
    useEffect(() => {
        if (!isTeacher) return;
        setLoadingStudents(true);
        getAllStudents()
            .then(setStudents)
            .catch(() => {})
            .finally(() => setLoadingStudents(false));
    }, [isTeacher]);

    // ── Carrega boletim do targetEmail ───────────────────────────────────────
    useEffect(() => {
        if (!targetEmail) {
            setGrades(null);
            return;
        }
        setLoading(true);
        const key = bulletinKey(targetEmail);
        SecureStore.getItemAsync(key)
            .then((json) => {
                if (json) {
                    setGrades(JSON.parse(json));
                } else {
                    const inicial = initGrades();
                    SecureStore.setItemAsync(
                        key,
                        JSON.stringify(inicial),
                    ).catch(() => {});
                    setGrades(inicial);
                }
            })
            .catch(() => setGrades(initGrades()))
            .finally(() => setLoading(false));
    }, [targetEmail]);

    // ── Salva nota ───────────────────────────────────────────────────────────
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
            await SecureStore.setItemAsync(
                bulletinKey(targetEmail),
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

    // Calcula média dos 2 maiores entre CP1, CP2, CP3
    function calcCpMedia(g) {
        const vals = [1, 2, 3]
            .map((n) => parseFloat(g[`cp${n}`]))
            .filter((v) => !isNaN(v));
        if (vals.length === 0) return "-";
        if (vals.length === 1) return vals[0].toFixed(1);
        const sorted = [...vals].sort((a, b) => b - a).slice(0, 2);
        return (sorted.reduce((s, v) => s + v, 0) / sorted.length).toFixed(1);
    }

    function abrirCpModal(subject) {
        setCpSubject(subject);
        const g = grades?.[subject] || DEFAULT_GRADES;
        setCpVals({
            1: g.cp1 === "-" ? "" : g.cp1,
            2: g.cp2 === "-" ? "" : g.cp2,
            3: g.cp3 === "-" ? "" : g.cp3,
        });
        setCpModal(true);
    }

    async function salvarCp() {
        setSavingCp(true);
        try {
            const updatedSubject = {
                ...grades[cpSubject],
                cp1: cpVals[1].trim() || "-",
                cp2: cpVals[2].trim() || "-",
                cp3: cpVals[3].trim() || "-",
            };
            const novoGrades = { ...grades, [cpSubject]: updatedSubject };
            await SecureStore.setItemAsync(
                bulletinKey(targetEmail),
                JSON.stringify(novoGrades),
            );
            setGrades(novoGrades);
            setCpModal(false);
        } catch (_) {
        } finally {
            setSavingCp(false);
        }
    }

    function abrirDetalhe(title, subject, field) {
        if (field === "cp") {
            abrirCpModal(subject);
            return;
        }
        const valor = grades?.[subject]?.[field] ?? "-";
        setDetail({ title, valor, subject });
        setModalVisible(true);
    }

    // ── Helpers de estilo com tema ───────────────────────────────────────────
    const s = makeStyles(colors);

    // ── Estado: professor sem aluno selecionado ──────────────────────────────
    if (isTeacher && !targetEmail) {
        return (
            <View style={s.container}>
                <View style={s.pageHeader}>
                    <Text style={s.title}>Boletim Acadêmico</Text>
                    <Text style={s.subtitle}>
                        Selecione um aluno para ver ou editar
                    </Text>
                </View>

                {loadingStudents ? (
                    <ActivityIndicator
                        color="#FF0C5C"
                        style={{ marginTop: 40 }}
                    />
                ) : students.length === 0 ? (
                    <Text
                        style={[
                            s.subtitle,
                            { textAlign: "center", marginTop: 40 },
                        ]}
                    >
                        Nenhum aluno cadastrado ainda.
                    </Text>
                ) : (
                    <FlatList
                        data={students}
                        keyExtractor={(item) => item.email}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 24,
                        }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.studentRow}
                                onPress={() => setTargetEmail(item.email)}
                                activeOpacity={0.75}
                            >
                                <View style={s.studentAvatar}>
                                    <Text style={s.studentAvatarText}>
                                        {item.name?.[0]?.toUpperCase() ?? "?"}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.studentName}>
                                        {item.name} {item.last_name}
                                    </Text>
                                    <Text style={s.studentSub}>
                                        {item.email}
                                        {item.class ? `  •  ${item.class}` : ""}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={colors.textMuted}
                                />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        );
    }

    // ── Loading boletim ──────────────────────────────────────────────────────
    if (loading || grades === null) {
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

    // Nome do aluno sendo visualizado
    const viewingStudent = isTeacher
        ? students.find((st) => st.email === targetEmail)
        : null;

    return (
        <View style={s.container}>
            <View style={s.pageHeader}>
                {/* Botão voltar para lista (professor) */}
                {isTeacher && (
                    <TouchableOpacity
                        style={s.backBtn}
                        onPress={() => setTargetEmail(null)}
                        activeOpacity={0.75}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FF0C5C" />
                        <Text style={s.backBtnText}>Alunos</Text>
                    </TouchableOpacity>
                )}

                <Text style={s.title}>
                    {isTeacher
                        ? `${viewingStudent?.name ?? ""} ${viewingStudent?.last_name ?? ""}`
                        : `${user?.class || "Turma"} — 2026`}
                </Text>
                <Text style={s.subtitle}>
                    Boletim Acadêmico{isTeacher ? " (modo edição)" : ""}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalContent}
            >
                <View style={s.tableCard}>
                    {/* Cabeçalho superior */}
                    <View style={s.headerTopRow}>
                        <View style={[s.headerTopCell, s.subjectHeader]}>
                            <Text style={s.headerTopCellText} />
                        </View>
                        <View style={s.groupBlock}>
                            <Text style={s.groupTitle}>1º SEMESTRE</Text>
                        </View>
                        <View style={s.groupBlock}>
                            <Text style={s.groupTitle}>2º SEMESTRE</Text>
                        </View>
                        <View style={s.resultGroup}>
                            <Text style={s.groupTitle}>RESULTADO</Text>
                        </View>
                    </View>

                    {/* Subcabeçalho */}
                    <View style={s.headerBottomRow}>
                        <View
                            style={[
                                s.headerBottomCell,
                                s.subjectHeader,
                                s.headerLabelContainer,
                            ]}
                        >
                            <Text style={s.headerLabelText}>DISCIPLINA</Text>
                            <Text style={s.headerLabelText}>\</Text>
                            <Text style={s.headerLabelText}>CATEGORIA</Text>
                        </View>
                        {["CP", "GS", "FA", "MD", "CP", "GS", "FA", "MD"].map(
                            (h, i) => (
                                <View
                                    key={i}
                                    style={[
                                        s.headerBottomCell,
                                        h === "MD" && s.headerPink,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            s.headerBottomCellText,
                                            h === "GS" && s.headerGreenText,
                                            h === "MD" && s.headerPinkText,
                                        ]}
                                    >
                                        {h}
                                    </Text>
                                </View>
                            ),
                        )}
                        <View style={s.headerBottomCell}>
                            <Text style={s.headerBottomCellText}>FALTAS</Text>
                        </View>
                        <View style={[s.headerBottomCell, s.headerMuted]}>
                            <Text
                                style={[
                                    s.headerBottomCellText,
                                    s.headerMutedText,
                                ]}
                            >
                                PR(%)
                            </Text>
                        </View>
                        <View style={s.headerBottomCell}>
                            <Text style={s.headerBottomCellText}>MP</Text>
                        </View>
                        <View style={s.headerBottomCell}>
                            <Text style={s.headerBottomCellText}>EXA</Text>
                        </View>
                        <View style={[s.headerBottomCell, s.headerPink]}>
                            <Text
                                style={[
                                    s.headerBottomCellText,
                                    s.headerPinkText,
                                ]}
                            >
                                MF
                            </Text>
                        </View>
                        <View style={s.situationHeader}>
                            <Text style={s.headerBottomCellText}>SITUAÇÃO</Text>
                        </View>
                    </View>

                    {/* Linhas */}
                    <ScrollView style={s.bodyScroll}>
                        {SUBJECTS.map((subject, index) => {
                            const g = grades[subject] || DEFAULT_GRADES;

                            function Celula({ field, cor }) {
                                const val = g[field] ?? "-";
                                return (
                                    <TouchableOpacity
                                        style={s.bodyCell}
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
                                        <View style={s.badge}>
                                            <Text
                                                style={[
                                                    s.cellText,
                                                    cor && { color: cor },
                                                    val === "-" && s.empty,
                                                ]}
                                            >
                                                {val}
                                            </Text>
                                            <Ionicons
                                                name={
                                                    isTeacher
                                                        ? "create-outline"
                                                        : "add"
                                                }
                                                size={isTeacher ? 10 : 12}
                                                color="#FF0C5C"
                                                style={s.icon}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <View key={index} style={s.row}>
                                    <View style={[s.bodyCell, s.subjectCell]}>
                                        <Text
                                            style={s.subjectCellText}
                                            numberOfLines={2}
                                        >
                                            {subject}
                                        </Text>
                                    </View>
                                    {/* CP — média dos 2 maiores entre CP1, CP2, CP3 */}
                                    <TouchableOpacity
                                        style={s.bodyCell}
                                        onPress={() => abrirCpModal(subject)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={s.badge}>
                                            <Text
                                                style={[
                                                    s.cellText,
                                                    calcCpMedia(g) === "-" &&
                                                        s.empty,
                                                ]}
                                            >
                                                {calcCpMedia(g)}
                                            </Text>
                                            <Ionicons
                                                name={
                                                    isTeacher
                                                        ? "create-outline"
                                                        : "eye-outline"
                                                }
                                                size={10}
                                                color="#FF0C5C"
                                                style={s.icon}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    <Celula field="gs1" cor="#039855" />
                                    <Celula field="fa1" />
                                    <View style={s.bodyCell}>
                                        <Text style={s.cellText}>-</Text>
                                    </View>
                                    {/* 2º sem — CP repete a mesma média */}
                                    <TouchableOpacity
                                        style={s.bodyCell}
                                        onPress={() => abrirCpModal(subject)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={s.badge}>
                                            <Text
                                                style={[
                                                    s.cellText,
                                                    calcCpMedia(g) === "-" &&
                                                        s.empty,
                                                ]}
                                            >
                                                {calcCpMedia(g)}
                                            </Text>
                                            <Ionicons
                                                name={
                                                    isTeacher
                                                        ? "create-outline"
                                                        : "eye-outline"
                                                }
                                                size={10}
                                                color="#FF0C5C"
                                                style={s.icon}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    <Celula field="gs2" cor="#039855" />
                                    <Celula field="fa2" />
                                    <View style={s.bodyCell}>
                                        <Text style={s.cellText}>-</Text>
                                    </View>
                                    {/* Faltas */}
                                    <Celula field="faltas" />
                                    {/* Presença calculada */}
                                    <View style={s.bodyCell}>
                                        {(() => {
                                            const faltas = parseInt(
                                                g.faltas ?? "0",
                                            );
                                            const pr = isNaN(faltas)
                                                ? "100%"
                                                : Math.max(
                                                      0,
                                                      Math.round(
                                                          ((TOTAL_AULAS -
                                                              faltas) /
                                                              TOTAL_AULAS) *
                                                              100,
                                                      ),
                                                  ) + "%";
                                            const baixa =
                                                !isNaN(faltas) &&
                                                (TOTAL_AULAS - faltas) /
                                                    TOTAL_AULAS <
                                                    0.75;
                                            return (
                                                <Text
                                                    style={[
                                                        s.cellText,
                                                        baixa && {
                                                            color: "#e53935",
                                                        },
                                                    ]}
                                                >
                                                    {pr}
                                                </Text>
                                            );
                                        })()}
                                    </View>
                                    <View style={s.bodyCell}>
                                        <Text style={s.cellText}>-</Text>
                                    </View>
                                    <View style={s.bodyCell}>
                                        <Text style={s.cellText}>-</Text>
                                    </View>
                                    <View style={s.bodyCell}>
                                        <Text
                                            style={[
                                                s.cellText,
                                                s.headerPinkText,
                                            ]}
                                        >
                                            -
                                        </Text>
                                    </View>
                                    <View style={s.situationHeader}>
                                        <Text style={s.cellText}>-</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Modal edição (professor) */}
            <Modal visible={modal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <Text style={s.modalTitle}>
                            Editar — {FIELD_LABELS[editField]}
                        </Text>
                        <Text style={s.modalSubtitle} numberOfLines={2}>
                            {editSubject}
                        </Text>
                        <TextInput
                            style={s.modalInput}
                            value={editValor}
                            onChangeText={setEditValor}
                            placeholder="Ex: 7.5"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="default"
                            autoFocus
                        />
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
                                onPress={salvarNota}
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

            <Modal visible={cpModal} transparent animationType="fade">
                <TouchableWithoutFeedback
                    onPress={Keyboard.dismiss}
                    accessible={false}
                >
                    <View style={s.modalOverlay}>
                        <View style={s.modal}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>Checkpoints</Text>
                                <TouchableOpacity
                                    onPress={() => setCpModal(false)}
                                >
                                    <Ionicons
                                        name="close"
                                        size={20}
                                        color="#FF0C5C"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={s.modalSubtitle} numberOfLines={2}>
                                {cpSubject}
                            </Text>

                            {isTeacher ? (
                                <>
                                    <Text style={s.modalLabel}>CP1</Text>
                                    <TextInput
                                        style={s.modalInput}
                                        value={cpVals[1]}
                                        onChangeText={(v) =>
                                            setCpVals((p) => ({ ...p, 1: v }))
                                        }
                                        placeholder="Ex: 7.5"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                    <Text style={s.modalLabel}>CP2</Text>
                                    <TextInput
                                        style={s.modalInput}
                                        value={cpVals[2]}
                                        onChangeText={(v) =>
                                            setCpVals((p) => ({ ...p, 2: v }))
                                        }
                                        placeholder="Ex: 8.0"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                    <Text style={s.modalLabel}>CP3</Text>
                                    <TextInput
                                        style={s.modalInput}
                                        value={cpVals[3]}
                                        onChangeText={(v) =>
                                            setCpVals((p) => ({ ...p, 3: v }))
                                        }
                                        placeholder="Ex: 6.0"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                    <Text
                                        style={[
                                            s.modalSubtitle,
                                            { marginTop: 6 },
                                        ]}
                                    >
                                        Média (2 maiores):{" "}
                                        <Text
                                            style={{
                                                fontWeight: "bold",
                                                color: "#FF0C5C",
                                            }}
                                        >
                                            {(() => {
                                                const vals = [1, 2, 3]
                                                    .map((l) =>
                                                        parseFloat(cpVals[l]),
                                                    )
                                                    .filter((v) => !isNaN(v));
                                                if (vals.length === 0)
                                                    return "-";
                                                const sorted = [...vals]
                                                    .sort((a, b) => b - a)
                                                    .slice(0, 2);
                                                return (
                                                    sorted.reduce(
                                                        (s, v) => s + v,
                                                        0,
                                                    ) / sorted.length
                                                ).toFixed(1);
                                            })()}
                                        </Text>
                                    </Text>
                                    <View style={s.modalBtns}>
                                        <TouchableOpacity
                                            style={s.modalBtnCancel}
                                            onPress={() => setCpModal(false)}
                                        >
                                            <Text style={s.modalBtnCancelText}>
                                                Cancelar
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={s.modalBtnSave}
                                            onPress={salvarCp}
                                            disabled={savingCp}
                                        >
                                            {savingCp ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text
                                                    style={s.modalBtnSaveText}
                                                >
                                                    Salvar
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {[1, 2, 3].map((l) => {
                                        const g =
                                            grades?.[cpSubject] ||
                                            DEFAULT_GRADES;
                                        const val = g[`cp${l}`] ?? "-";
                                        return (
                                            <View key={l} style={s.cpDetailRow}>
                                                <Text style={s.cpDetailLabel}>
                                                    CP{l}
                                                </Text>
                                                <Text
                                                    style={[
                                                        s.cpDetailVal,
                                                        val === "-" && s.empty,
                                                    ]}
                                                >
                                                    {val}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                    {(() => {
                                        const g =
                                            grades?.[cpSubject] ||
                                            DEFAULT_GRADES;
                                        const media = calcCpMedia(g);
                                        return (
                                            <View
                                                style={[
                                                    s.cpDetailRow,
                                                    {
                                                        borderTopWidth: 1,
                                                        borderTopColor:
                                                            colors.separator,
                                                        marginTop: 8,
                                                        paddingTop: 12,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        s.cpDetailLabel,
                                                        { color: "#FF0C5C" },
                                                    ]}
                                                >
                                                    Média (2 maiores)
                                                </Text>
                                                <Text
                                                    style={[
                                                        s.cpDetailVal,
                                                        { color: "#FF0C5C" },
                                                    ]}
                                                >
                                                    {media}
                                                </Text>
                                            </View>
                                        );
                                    })()}
                                    <TouchableOpacity
                                        style={[s.closeBtn, { marginTop: 16 }]}
                                        onPress={() => setCpModal(false)}
                                    >
                                        <Text style={s.closeBtnText}>
                                            Fechar
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{detail?.title}</Text>
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
                        <Text style={s.modalSubtitle} numberOfLines={2}>
                            {detail?.subject}
                        </Text>
                        <Text style={s.detalheValor}>
                            {detail?.valor ?? "-"}
                        </Text>
                        <TouchableOpacity
                            style={s.closeBtn}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={s.closeBtnText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function makeStyles(c) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.bg, paddingTop: 18 },
        pageHeader: { paddingHorizontal: 14, marginBottom: 10 },
        title: { fontSize: 22, fontWeight: "bold", color: c.text },
        subtitle: { fontSize: 13, marginTop: 2, color: c.textSecondary },

        // Voltar
        backBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginBottom: 6,
        },
        backBtnText: { color: "#FF0C5C", fontWeight: "bold", fontSize: 14 },

        // Lista de alunos
        studentRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.card,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: c.cardBorder,
            gap: 12,
        },
        studentAvatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#FF0C5C",
            alignItems: "center",
            justifyContent: "center",
        },
        studentAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
        studentName: { fontSize: 15, fontWeight: "bold", color: c.text },
        studentSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },

        // Tabela
        horizontalContent: { paddingHorizontal: 12, paddingBottom: 20 },
        tableCard: {
            backgroundColor: c.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.cardBorder,
            overflow: "hidden",
        },
        headerTopRow: {
            flexDirection: "row",
            backgroundColor: c.headerBg,
            borderBottomWidth: 1,
            borderBottomColor: c.cardBorder,
        },
        headerTopCell: {
            height: 48,
            justifyContent: "center",
            alignItems: "center",
        },
        headerTopCellText: {
            fontWeight: "700",
            color: c.text,
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
        headerLabelText: { fontSize: 11, fontWeight: "700", color: c.text },
        groupBlock: {
            width: 208,
            borderLeftWidth: 1,
            borderLeftColor: c.cardBorder,
            justifyContent: "center",
            alignItems: "center",
        },
        resultGroup: {
            width: 304,
            borderLeftWidth: 1,
            borderLeftColor: c.cardBorder,
            justifyContent: "center",
            alignItems: "center",
        },
        groupTitle: { fontSize: 12, fontWeight: "700", color: c.text },
        headerBottomRow: {
            flexDirection: "row",
            backgroundColor: c.card,
            borderBottomWidth: 1,
            borderBottomColor: c.cardBorder,
        },
        headerBottomCell: {
            width: 52,
            height: 38,
            justifyContent: "center",
            alignItems: "center",
            borderLeftWidth: 1,
            borderLeftColor: c.separator,
        },
        headerBottomCellText: {
            fontSize: 11,
            fontWeight: "700",
            color: c.text,
            textAlign: "center",
        },
        situationHeader: {
            width: 96,
            minHeight: 38,
            justifyContent: "center",
            alignItems: "center",
            borderLeftWidth: 1,
            borderLeftColor: c.separator,
        },
        headerGreenText: { color: "#039855" },
        headerPink: {},
        headerPinkText: { color: "#FF0C5C" },
        headerMuted: {},
        headerMutedText: { color: c.textMuted },
        bodyScroll: { maxHeight: 520 },
        row: {
            flexDirection: "row",
            minHeight: 66,
            borderBottomWidth: 1,
            borderBottomColor: c.separator,
            backgroundColor: c.card,
        },
        bodyCell: {
            width: 52,
            justifyContent: "center",
            alignItems: "center",
            borderLeftWidth: 1,
            borderLeftColor: c.separator,
        },
        subjectCell: {
            width: 240,
            paddingHorizontal: 14,
            justifyContent: "center",
            alignItems: "flex-start",
        },
        subjectCellText: {
            fontWeight: "500",
            color: c.text,
            fontSize: 13,
            lineHeight: 18,
            textAlign: "left",
        },
        badge: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.badgeBg,
            paddingHorizontal: 4,
            paddingVertical: 5,
            borderRadius: 999,
            minWidth: 38,
        },
        icon: { marginLeft: 2 },
        cellText: { fontSize: 12, fontWeight: "600", color: c.text },
        empty: { color: c.textMuted },

        // Modais
        modalOverlay: {
            flex: 1,
            backgroundColor: c.overlay,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 18,
        },
        modal: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: c.card,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: c.cardBorder,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: "bold",
            color: c.text,
            flex: 1,
        },
        modalSubtitle: {
            fontSize: 12,
            color: c.textSecondary,
            marginTop: 4,
            marginBottom: 14,
        },
        modalInput: {
            borderWidth: 1,
            borderColor: c.inputBorder,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            marginBottom: 8,
            backgroundColor: c.inputBg,
            color: c.text,
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
        closeBtnText: { color: "#fff", fontWeight: "bold" },
        modalLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: c.text,
            marginBottom: 4,
            marginTop: 8,
        },
        cpDetailRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: c.separator,
        },
        cpDetailLabel: { fontSize: 14, fontWeight: "600", color: c.text },
        cpDetailVal: { fontSize: 18, fontWeight: "bold", color: c.text },
    });
}
