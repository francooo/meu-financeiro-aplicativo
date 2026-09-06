import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient, startAppStateSync } from "./src/api/queryClient";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { MonthProvider } from "./src/state/MonthContext";
import { LoadingState } from "./src/components/ui";
import LoginScreen from "./src/screens/LoginScreen";
import RootNavigator from "./src/navigation";
import { colors } from "./src/lib/theme";

export default function App() {
  // Liga o refetch-ao-focar do React Query ao ciclo de vida do app: é assim
  // que uma alteração feita no navegador aparece aqui ao trazer o app de volta.
  useEffect(() => startAppStateSync(), []);

  return (
    <GestureHandlerRootView style={st.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </QueryClientProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Decide entre login e app. MonthProvider só monta autenticado, porque
    depende de GET /api/months. */
function Gate() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={st.center}>
        <LoadingState label="Verificando sessão…" />
      </View>
    );
  }

  if (status === "signedOut") return <LoginScreen />;

  return (
    <MonthProvider>
      <RootNavigator />
    </MonthProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", backgroundColor: colors.bg },
});
