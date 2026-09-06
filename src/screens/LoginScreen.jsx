import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { ErrorState, PrimaryButton } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import { useGoogleAuth } from "../auth/google";
import { colors, font, radius, spacing } from "../lib/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { ready, configError, signInWithGoogle } = useGoogleAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Com a biblioteca nativa o token volta direto do signIn(), sem passar por
   * redirect nem por efeito — o fluxo inteiro cabe neste handler.
   */
  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return; // usuário fechou o seletor de conta
      await signIn(idToken);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const shownError = error || (configError ? { message: configError } : null);

  return (
    <SafeAreaView style={st.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
        <View style={st.brand}>
          <View style={st.logo}>
            <Icon name="Wallet" size={30} color={colors.textOnPrimary} />
          </View>
          <Text style={st.title}>Meu Financeiro</Text>
          <Text style={st.tagline}>Seus gastos e ganhos, no bolso.</Text>
        </View>

        <View style={st.actions}>
          <PrimaryButton
            label="Entrar com Google"
            icon="DollarSign"
            loading={busy}
            disabled={!ready}
            onPress={handleLogin}
          />
          <Text style={st.note}>
            O acesso é restrito à conta autorizada no servidor.
          </Text>
        </View>

        {shownError ? <ErrorState error={shownError} /> : null}

        {/* Em desenvolvimento, mostrar para onde o app está apontando evita
            confundir "API errada" com "login quebrado". */}
        {__DEV__ ? (
          <View style={st.debug}>
            <Text style={st.debugLabel}>API</Text>
            <Text style={st.debugValue} selectable>
              {process.env.EXPO_PUBLIC_API_URL || "(EXPO_PUBLIC_API_URL não definida)"}
            </Text>
            <Text style={st.debugLabel}>Client ID (Web)</Text>
            <Text style={st.debugValue} selectable numberOfLines={1}>
              {process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || "(não definida)"}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  brand: { alignItems: "center", gap: spacing.md },
  logo: {
    height: 68,
    width: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: font.xxl, fontWeight: "700", color: colors.primary },
  tagline: { fontSize: font.md, color: colors.textMuted },

  actions: { gap: spacing.md },
  note: { fontSize: font.sm, color: colors.textMuted, textAlign: "center" },

  debug: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  debugLabel: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.textSubtle,
    textTransform: "uppercase",
  },
  debugValue: { fontSize: font.sm, color: colors.text },
});
