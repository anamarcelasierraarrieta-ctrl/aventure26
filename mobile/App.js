import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "./src/screens/LoginScreen";
import AppointmentsScreen from "./src/screens/AppointmentsScreen";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.beige }, headerTintColor: colors.ink }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Aventure 26" }} />
        <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: "Mis citas" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
