import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../api/client";
import { colors } from "../theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("admin@aventure26.demo");
  const [password, setPassword] = useState("Aventure26!");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await AsyncStorage.setItem("a26_access_token", data.accessToken);
      navigation.replace("Appointments");
    } catch {
      setError("Credenciales inválidas");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aventure 26</Text>
      <Text style={styles.subtitle}>Agenda tu cita</Text>

      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Correo" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Contraseña" />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.beige, justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "700", color: colors.gold, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.ink, textAlign: "center", marginBottom: 24 },
  input: {
    backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.pink,
  },
  button: { backgroundColor: colors.gold, borderRadius: 16, padding: 14, marginTop: 8 },
  buttonText: { color: colors.white, textAlign: "center", fontWeight: "600" },
  error: { color: "#c0392b", marginBottom: 8, textAlign: "center" },
});
