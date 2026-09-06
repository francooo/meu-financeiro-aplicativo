import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";
import { colors, font, radius, shadow, spacing, TOUCH_TARGET } from "../lib/theme";
import { fmt } from "../lib/format";

/* ---------- texto ---------- */

export function Title({ children, style }) {
  return <Text style={[s.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }) {
  return <Text style={[s.subtitle, style]}>{children}</Text>;
}

/** Valor monetário. `tone` dá o sinal semântico sem depender só da cor. */
export function Money({ value, tone = "neutral", size = font.md, style }) {
  const tint =
    tone === "income" ? colors.income : tone === "expense" ? colors.expense : colors.text;
  return (
    <Text style={[{ fontSize: size, fontWeight: "600", color: tint }, style]}>
      {fmt(value)}
    </Text>
  );
}

/* ---------- contêineres ---------- */

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/* ---------- estados ---------- */

export function LoadingState({ label = "Carregando…" }) {
  return (
    <View style={s.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={s.stateText}>{label}</Text>
    </View>
  );
}

export function Empty({ icon = "Tag", label }) {
  return (
    <View style={s.state}>
      <Icon name={icon} size={28} color={colors.textSubtle} />
      <Text style={s.stateText}>{label}</Text>
    </View>
  );
}

/**
 * Falha visível, com ação de recuperação.
 *
 * Esta é a peça que o web não tinha e que a escrita granular torna obrigatória:
 * lá, todo erro era engolido e a interface exibia "Salvo" de qualquer forma
 * (_reference/meu-caixa.jsx:795). Enquanto a persistência era por replace, o
 * autosave seguinte reenviava tudo e curava sozinho. Com escrita por item esse
 * auto-cura não existe — uma falha não mostrada é um dado perdido em silêncio.
 */
export function ErrorState({ error, onRetry, compact = false }) {
  if (!error) return null;

  const offline = error.isOffline;
  const message =
    error.message || "Algo deu errado. Tente novamente.";

  return (
    <View style={[s.error, compact && s.errorCompact]}>
      <View style={s.errorHeader}>
        <Icon name="AlertTriangle" size={18} color={colors.danger} />
        <Text style={s.errorTitle}>
          {offline ? "Sem conexão com o servidor" : "Não foi possível concluir"}
        </Text>
      </View>
      <Text style={s.errorMessage}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [s.retry, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={s.retryText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- botões ---------- */

export function PrimaryButton({ label, onPress, disabled, loading, icon, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      style={({ pressed }) => [
        s.button,
        (disabled || loading) && s.buttonDisabled,
        pressed && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} size="small" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={colors.textOnPrimary} /> : null}
          <Text style={s.buttonText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  title: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },

  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  stateText: { fontSize: font.sm, color: colors.textMuted, textAlign: "center" },

  error: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorCompact: { padding: spacing.md },
  errorHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  errorTitle: { fontSize: font.md, fontWeight: "700", color: "#991B1B", flexShrink: 1 },
  errorMessage: { fontSize: font.sm, color: "#7F1D1D", lineHeight: 19 },

  retry: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: spacing.lg,
    alignSelf: "flex-start",
  },
  retryText: { fontSize: font.sm, fontWeight: "600", color: "#991B1B" },

  button: {
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.textOnPrimary, fontSize: font.md, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
