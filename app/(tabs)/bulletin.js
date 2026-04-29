// Importa React e hooks necessários
import React, { useState } from 'react';
// Componentes básicos do React Native usados na tela
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal
} from 'react-native';

// Dados estáticos do estudante (ex.: turma, nome)
import { useAuth } from '../../context/AuthContext';

// Ícones do Expo e dados do boletim (lista de disciplinas/entradas)
import { Ionicons } from '@expo/vector-icons';
import { bulletin } from '../../data/bulletin.data';


export default function Bulletin() {
    // Desestrutura user do useAuth para ser usado depois
    const { user } = useAuth(); 
    // Componente principal que renderiza o boletim.
    // `modalVisible`: controla se o modal de detalhes está aberto.
    const [modalVisible, setModalVisible] = useState(false);
    // `detail`: objeto com informações do modal (título, modo, colunas, linhas ou valores)
    const [detail, setDetail] = useState(null);

    // Converte um array de objetos/valores (`values`) em linhas (arrays)
    // usando as chaves em `keys`. Normaliza nomes em português/inglês
    // (atividade/activity, data/date, nota/score, max/maximum, quantidade/qty).
    // Retorna apenas linhas que contenham pelo menos um valor não-vazio.
    const parseRowsToCells = (values, keys) => {
        if (!Array.isArray(values)) return [];

        return values
            .map((item) => {
                // Quando o item for um objeto, extrai os campos conforme as chaves
                if (item && typeof item === 'object') {
                    return keys.map((key) => {
                        if (key === 'atividade') return item.atividade ?? item.activity ?? '-';
                        if (key === 'data') return item.data ?? item.date ?? '-';
                        if (key === 'nota') return item.nota ?? item.score ?? '-';
                        if (key === 'max') return item.max ?? item.maximum ?? '-';
                        if (key === 'quantidade') return item.quantidade ?? item.qty ?? '-';
                        return item[key] ?? '-';
                    });
                }

                // Quando o item for um valor simples (string/number), coloca-o na primeira coluna
                const row = keys.map(() => '-');
                row[0] = String(item ?? '-');
                return row;
            })
            // Filtra linhas vazias (todas as células vazias) para não mostrar entradas inúteis
            .filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''));
    };


    // Retorna a configuração de colunas (labels) e chaves (campos) a serem
    // exibidos no modal de detalhamento com base no `title` selecionado.
    // Suporta casos de "Faltas" (apenas data/quantidade) e "GS"/avalições.
    const getTableConfigByTitle = (title) => {
        if (title.includes('Faltas')) {
            return {
                columns: ['DATA', 'QUANTIDADE'],
                keys: ['data', 'quantidade'],
            };
        }

        if (title.includes('GS')) {
            return {
                columns: ['ATIVIDADE', 'DATA', 'NOTA', 'MAX'],
                keys: ['atividade', 'data', 'nota', 'max'],
            };
        }

        // Padrão: avaliação com atividade, data, nota e máximo
        return {
            columns: ['ATIVIDADE', 'DATA', 'NOTA', 'MAX'],
            keys: ['atividade', 'data', 'nota', 'max'],
        };
    };

    // Ao clicar em uma célula, decide como apresentar o detalhamento:
    // - Modo 'table' para CP/GS/Faltas (exibe colunas e linhas)
    // - Modo 'list' para outros casos (lista simples de valores)
    const openDetail = (title, values) => {

        let finalValues = values;

        // Para CP, GS e Faltas apresentamos uma tabela com colunas apropriadas
        if (title.includes('CP') || title.includes('GS') || title.includes('Faltas')) {
            const config = getTableConfigByTitle(title);
            const rows = parseRowsToCells(values, config.keys);
            setDetail({
                title,
                mode: 'table',
                columns: config.columns,
                rows,
            });
            setModalVisible(true);
            return;
        }

        // Se não houver dados, mostra uma mensagem padrão
        if (!finalValues || finalValues.length === 0) {
            finalValues = ['Nenhuma nota lançada até o momento'];
        }

        setDetail({ title, mode: 'list', values: finalValues });
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>{user?.class} - 2026</Text>
                <Text style={styles.subtitle}>Boletim Acadêmico</Text>
            </View>

            {/* Área rolável horizontal que contém a 'tabela' do boletim */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
                {/* Card que contém o cabeçalho e o corpo da tabela */}
                <View style={styles.tableCard}>
                    {/* Cabeçalho principal da tabela */}
                    <View style={styles.headerTopRow}>
                        <Text style={[styles.headerTopCell, styles.subjectHeader]}>DISCIPLINA</Text>

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

                    {/*  Subcabeçalho com colunas de notas */}
                    <View style={styles.headerBottomRow}>
                        <Text style={[styles.headerBottomCell, styles.subjectHeader]}> </Text>

                        <Text style={styles.headerBottomCell}>CP</Text>
                        <Text style={[styles.headerBottomCell, styles.headerGreen]}>GS</Text>
                        <Text style={styles.headerBottomCell}>FA</Text>
                        <Text style={[styles.headerBottomCell, styles.headerPink]}>MD</Text>

                        <Text style={styles.headerBottomCell}>CP</Text>
                        <Text style={[styles.headerBottomCell, styles.headerGreen]}>GS</Text>
                        <Text style={styles.headerBottomCell}>FA</Text>
                        <Text style={[styles.headerBottomCell, styles.headerPink]}>MD</Text>

                        <Text style={styles.headerBottomCell}>AULAS</Text>
                        <Text style={[styles.headerBottomCell, styles.headerMuted]}>PR(%)</Text>
                        <Text style={styles.headerBottomCell}>MP</Text>
                        <Text style={styles.headerBottomCell}>EXA</Text>
                        <Text style={[styles.headerBottomCell, styles.headerPink]}>MF</Text>
                        <Text style={styles.situationHeader}>SITUAÇÃO</Text>
                    </View>

                    {/* Linhas do corpo */}
                    <ScrollView style={styles.bodyScroll}>
                        {bulletin.map((item, index) => (
                            <View key={index} style={styles.row}>
                                {/* Nome da disciplina */}
                                <Text style={[styles.bodyCell, styles.subjectCell]} numberOfLines={2}>
                                    {item.subject}
                                </Text>

                                {/* CP 1º Sem - abre modal com detalhes (tabela) */}
                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('CP 1º Sem', item.cp1Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.badge}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                (item.cp1 === '-' || item.cp1 === null || item.cp1 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.cp1 ?? '-'}
                                        </Text>
                                        <Ionicons name="add" size={12} color="#FF0C5C" style={styles.icon} />
                                    </View>
                                </TouchableOpacity>

                                {/* GS 1º Sem - nota final/agrupamento (sem modal por padrão) */}
                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('GS 1º Sem', item.gs1Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={[styles.badge, styles.badgePlain]}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                styles.green,
                                                (item.gs1 === '-' || item.gs1 === null || item.gs1 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.gs1 ?? '-'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Faltas 1º Sem - abre modal com detalhes de faltas */}
                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('Faltas 1º Sem', item.fa1Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.badge}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                (item.fa1 === '-' || item.fa1 === null || item.fa1 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.fa1 ?? '-'}
                                        </Text>
                                        <Ionicons name="add" size={12} color="#FF0C5C" style={styles.icon} />
                                    </View>
                                </TouchableOpacity>

                                {/* Colunas intermediárias e 2º semestre seguem o mesmo padrão */}
                                <View style={styles.bodyCell}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('CP 2º Sem', item.cp2Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.badge}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                (item.cp2 === '-' || item.cp2 === null || item.cp2 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.cp2 ?? '-'}
                                        </Text>
                                        <Ionicons name="add" size={12} color="#FF0C5C" style={styles.icon} />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('GS 2º Sem', item.gs2Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={[styles.badge, styles.badgePlain]}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                styles.green,
                                                (item.gs2 === '-' || item.gs2 === null || item.gs2 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.gs2 ?? '-'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.bodyCell}
                                    onPress={() => openDetail('Faltas 2º Sem', item.fa2Details)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.badge}>
                                        <Text
                                            style={[
                                                styles.cellText,
                                                (item.fa2 === '-' || item.fa2 === null || item.fa2 === undefined) && styles.empty,
                                            ]}
                                        >
                                            {item.fa2 ?? '-'}
                                        </Text>
                                        <Ionicons name="add" size={12} color="#FF0C5C" style={styles.icon} />
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.bodyCell}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>

                                {/* Aulas, presença e demais campos do resultado */}
                                <View style={styles.bodyCell}>
                                    <Text style={[styles.cellText, styles.strong]}>{item.aulas ?? '-'}</Text>
                                </View>

                                <View style={styles.bodyCell}>
                                    <Text style={[styles.cellText, styles.muted]}>{item.pr ?? '-'}</Text>
                                </View>

                                <View style={styles.bodyCell}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>

                                <View style={styles.bodyCell}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>

                                <View style={styles.bodyCell}>
                                    <Text style={[styles.cellText, styles.headerPink]}>-</Text>
                                </View>

                                <View style={styles.bodyCell}>
                                    <Text style={styles.cellText}>-</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Exibe detalhes ao clicar em uma célula */}
            <Modal visible={modalVisible} transparent animationType="fade">

                <View style={styles.modalOverlay}>

                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {detail?.title}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={20} color="#FF0C5C" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            {detail?.mode === 'table'
                                ? 'Detalhamento em tabela'
                                : detail?.title?.includes('Faltas')
                                    ? 'Detalhamento de faltas'
                                    : 'Detalhamento das avaliações'}
                        </Text>

                        {detail?.mode === 'table' ? (
                            <View style={styles.detailTable}>
                                <View style={[styles.detailRow, styles.detailHeaderRow]}>
                                    {detail.columns.map((col) => (
                                        <Text
                                            key={col}
                                            style={[
                                                styles.detailCell,
                                                styles.detailHeaderCell,
                                                detail.columns.length > 2 && col === detail.columns[0] && styles.detailFirstColCell,
                                            ]}
                                        >
                                            {col}
                                        </Text>
                                    ))}
                                </View>

                                {detail?.rows?.length > 0 ? (
                                    detail.rows.map((row, index) => (
                                        <View key={index} style={styles.detailRow}>
                                            {row.map((cell, cellIndex) => (
                                                <Text
                                                    key={`${index}-${cellIndex}`}
                                                    style={[
                                                        styles.detailCell,
                                                        detail.columns.length > 2 && cellIndex === 0 && styles.detailFirstColCell,
                                                    ]}
                                                >
                                                    {cell ?? '-'}
                                                </Text>
                                            ))}
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.detailRow}>
                                        {detail.columns.map((_, index) => (
                                            <Text
                                                key={`empty-${index}`}
                                                style={[
                                                    styles.detailCell,
                                                    detail.columns.length > 2 && index === 0 && styles.detailFirstColCell,
                                                ]}
                                            >
                                                -
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : (
                            detail?.values?.map((v, i) => (
                                <View key={i} style={styles.modalItem}>
                                    <Ionicons name="ellipse" size={6} color="#FF0C5C" />
                                    <Text style={styles.modalText}>{v}</Text>
                                </View>
                            ))
                        )}

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

    container: {
        flex: 1,
        backgroundColor: '#F4F6FA',
        paddingTop: 18,
    },

    pageHeader: {
        paddingHorizontal: 14,
        marginBottom: 10,
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#101828',
    },

    subtitle: {
        fontSize: 13,
        marginTop: 2,
        color: '#667085',
    },

    horizontalContent: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },

    tableCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E7EAF0',
        overflow: 'hidden',
    },

    headerTopRow: {
        flexDirection: 'row',
        backgroundColor: '#FAFBFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E7EAF0',
    },

    headerTopCell: {
        height: 48,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontWeight: '700',
        color: '#1D2939',
        fontSize: 12,
        includeFontPadding: false,
    },

    subjectHeader: {
        width: 240,
        textAlign: 'left',
        paddingHorizontal: 14,
    },

    groupBlock: {
        width: 208,
        borderLeftWidth: 1,
        borderLeftColor: '#E7EAF0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    resultGroup: {
        width: 304,
        borderLeftWidth: 1,
        borderLeftColor: '#E7EAF0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    groupTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1D2939',
    },

    headerBottomRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E7EAF0',
    },

    headerBottomCell: {
        width: 52,
        height: 38,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: '#344054',
        borderLeftWidth: 1,
        borderLeftColor: '#F0F2F7',
        includeFontPadding: false,
    },

    situationHeader: {
        width: 96,
        height: 38,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: '#344054',
        borderLeftWidth: 1,
        borderLeftColor: '#F0F2F7',
        includeFontPadding: false,
    },

    headerGreen: {
        color: '#039855',
    },

    headerPink: {
        color: '#FF0C5C',
    },

    headerMuted: {
        color: '#98A2B3',
    },

    bodyScroll: {
        maxHeight: 520,
    },

    row: {
        flexDirection: 'row',
        minHeight: 66,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F7',
        backgroundColor: '#FFFFFF',
    },

    bodyCell: {
        width: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#F7F8FB',
    },

    subjectCell: {
        width: 240,
        textAlign: 'left',
        fontWeight: '500',
        color: '#1D2939',
        fontSize: 13,
        lineHeight: 18,
        paddingHorizontal: 14,
    },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 6,
        paddingVertical: 5,
        borderRadius: 999,
        minWidth: 38,
    },

    badgePlain: {
        backgroundColor: 'transparent',
        minWidth: 0,
        paddingHorizontal: 0,
    },

    icon: {
        marginLeft: 2,
    },

    cellText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#344054',
    },

    green: {
        color: '#039855',
    },

    strong: {
        color: '#101828',
        fontWeight: '700',
    },

    muted: {
        color: '#98A2B3',
    },

    empty: {
        color: '#98A2B3',
    },

    /* MODAL */

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(16,24,40,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 18,
    },

    modal: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EAECF0',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#101828',
    },

    modalSubtitle: {
        fontSize: 12,
        color: '#667085',
        marginBottom: 14,
        marginTop: 4,
    },

    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },

    modalText: {
        fontSize: 14,
        color: '#344054',
        flex: 1,
    },

    detailTable: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EAECF0',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },

    detailHeaderRow: {
        backgroundColor: '#F8FAFC',
    },

    detailRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EAECF0',
    },

    detailCell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        textAlign: 'center',
        fontSize: 12,
        color: '#344054',
        borderRightWidth: 1,
        borderRightColor: '#EAECF0',
    },

    detailHeaderCell: {
        fontWeight: '700',
        color: '#101828',
    },

    detailFirstColCell: {
        flex: 1.8,
        textAlign: 'left',
    },

    closeBtn: {
        marginTop: 16,
        backgroundColor: '#FF0C5C',
        padding: 10,
        borderRadius: 8,
        width: 120,
        alignItems: 'center',
    },

    closeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});