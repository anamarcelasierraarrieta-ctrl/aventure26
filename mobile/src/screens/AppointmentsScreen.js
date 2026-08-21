import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

import api from "../api/client";
import { colors } from "../theme";

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    api
      .get(`/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => setAppointments(r.data))
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis próximas citas</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.service}>{item.service.name}</Text>
            <Text style={styles.meta}>
              {new Date(item.startTime).toLocaleString("es-CO")}
            </Text>
            <Text style={styles.meta}>Con {item.stylist.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>No tienes citas próximas.</Text>}
      />
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ Agendar cita</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.beige, padding: 20 },
  header: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 16 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.pink,
  },
  service: { fontWeight: "700", color: colors.ink, marginBottom: 4 },
  meta: { color: "#7a6a6a", fontSize: 12 },
  fab: { backgroundColor: colors.gold, borderRadius: 16, padding: 16, marginTop: 8 },
  fabText: { color: colors.white, textAlign: "center", fontWeight: "700" },
});
