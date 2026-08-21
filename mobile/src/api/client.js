import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:4000/api";

const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("a26_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
