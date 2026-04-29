import { Calendar } from "react-native-calendars";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const EVENTS_KEY = "@fiap_calendar_events";

export default function CalendarScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [selected,  setSelected]  = useState("");
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  // modal de novo evento
  const [modal,     setModal]     = useState(false);
  const [titulo,    setTitulo]    = useState("");
  const [materia,   setMateria]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [erros,     setErros]     = useState({});

  useEffect(() => {
    async function load() {
      try {
        const json = await AsyncStorage.getItem(EVENTS_KEY);
        if (json) setEvents(JSON.parse(json));
      } catch (_) {}
      finally { setLoading(false); }
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

  const eventsToday = events.filter(ev => formatToCalendar(ev.date) === selected);

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
        date: selected.split("-").reverse().join("/"), // yyyy-mm-dd → dd/mm/yyyy
        addedBy: user?.email,
      };
      const novosEvents = [...events, novoEvento];
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(novosEvents));
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
    const novosEvents = events.filter(ev => ev.id !== id);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(novosEvents));
    setEvents(novosEvents);
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#FF0C5C" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/FIAP.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Calendário Acadêmico</Text>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.calendarStyle}>
          <Calendar
            onDayPress={(day) => setSelected(day.dateString)}
            markedDates={{
              ...markedDates,
              [selected]: { ...(markedDates[selected] || {}), selected: true, selectedColor: "#FF0C5C" },
            }}
            theme={{ todayTextColor: "#FF0C5C", arrowColor: "#FF0C5C", selectedDayBackgroundColor: "#FF0C5C", dotColor: "#FF0C5C" }}
          />
        </View>
      </View>

      {/* Botão de adicionar evento (professor) */}
      {isTeacher && selected !== "" && (
        <View style={styles.addContainer}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar evento</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Eventos do dia */}
      {selected !== "" && (
        <View style={styles.eventContainer}>
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>Eventos — {selected.split("-").reverse().join("/")}</Text>

            {eventsToday.length === 0 ? (
              <Text style={styles.eventMessage}>Nenhum evento nesta data.</Text>
            ) : (
              eventsToday.map((ev) => (
                <View key={ev.id} style={styles.eventRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventNome}>{ev.title}</Text>
                    <Text style={styles.eventMateria}>{ev.subject}</Text>
                  </View>
                  {/* Professor pode remover seus próprios eventos */}
                  {isTeacher && ev.addedBy === user?.email && (
                    <TouchableOpacity onPress={() => removerEvento(ev.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color="#e53935" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Modal novo evento */}
      <Modal visible={modal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Novo evento — {selected.split("-").reverse().join("/")}</Text>

            <Text style={styles.modalLabel}>Título</Text>
            <TextInput
              style={[styles.modalInput, erros.titulo && styles.modalInputErro]}
              placeholder="Ex: Checkpoint 1"
              value={titulo}
              onChangeText={v => { setTitulo(v); setErros(p => ({ ...p, titulo: undefined })); }}
            />
            <Text style={styles.erroInline}>{erros.titulo ?? " "}</Text>

            <Text style={styles.modalLabel}>Matéria</Text>
            <TextInput
              style={[styles.modalInput, erros.materia && styles.modalInputErro]}
              placeholder="Ex: Mobile Development & IoT"
              value={materia}
              onChangeText={v => { setMateria(v); setErros(p => ({ ...p, materia: undefined })); }}
            />
            <Text style={styles.erroInline}>{erros.materia ?? " "}</Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={salvarEvento} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingTop: 30, alignItems: "center", marginBottom: 10 },
  logo: { width: 140, height: 60 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  calendarContainer: { flexDirection: "row", justifyContent: "center" },
  calendarStyle: { padding: 20, borderRadius: 20, width: "90%", backgroundColor: "#fff" },
  addContainer: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FF0C5C", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  eventContainer: { marginTop: 16, flexDirection: "row", justifyContent: "center", paddingBottom: 24 },
  eventCard: { width: "90%", padding: 20, borderRadius: 14, backgroundColor: "#fff", elevation: 3 },
  eventTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  eventRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  eventNome: { fontSize: 14, fontWeight: "bold", color: "#171717" },
  eventMateria: { fontSize: 12, color: "#666", marginTop: 2 },
  eventMessage: { textAlign: "center", color: "#666" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  modal: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 16, color: "#171717" },
  modalLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  modalInputErro: { borderColor: "#e53935" },
  erroInline: { color: "#e53935", fontSize: 12, marginTop: 4, minHeight: 18 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  modalBtnCancelText: { fontWeight: "bold", color: "#666" },
  modalBtnSave: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FF0C5C", alignItems: "center" },
  modalBtnSaveText: { fontWeight: "bold", color: "#fff" },
});
