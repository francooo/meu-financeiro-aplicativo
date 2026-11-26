import { Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Icon } from "./Icon";
import { useAssistant } from "../assistant/AssistantContext";
import { colors, shadow, spacing } from "../lib/theme";

/**
 * Botão flutuante da assistente, no canto inferior direito.
 *
 * É desenhado pelo ScreenShell, dentro da área da aba: como a tab bar fica
 * FORA da tela da aba, `bottom` relativo à tela já cai acima dela — não é
 * preciso medir a altura da barra.
 */
export function AssistantFab() {
  const { setOpen } = useAssistant();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setOpen(true);
      }}
      accessibilityRole="button"
      accessibilityLabel="Abrir assistente financeira"
      hitSlop={8}
      style={({ pressed }) => [st.fab, pressed && st.pressed]}
    >
      <Icon name="Sparkles" size={24} color={colors.textOnPrimary} />
    </Pressable>
  );
}

export const FAB_SIZE = 56;

const st = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
