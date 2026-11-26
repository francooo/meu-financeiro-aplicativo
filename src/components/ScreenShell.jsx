import { useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./Icon";
import { ErrorState, LoadingState } from "./ui";
import { AssistantFab, FAB_SIZE } from "./AssistantFab";
import { useMonth } from "../state/MonthContext";
import { monthLabel } from "../lib/format";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

/**
 * Estrutura comum das abas: cabeçalho, seletor de mês, pull-to-refresh e os
 * estados de carregamento e erro.
 *
 * O pull-to-refresh não é enfeite: é o gesto pelo qual o usuário puxa o que
 * foi alterado no navegador. Junto com o refetch ao focar (queryClient.js),
 * é o que sustenta a sincronização entre as duas plataformas.
 */
export function ScreenShell({
  title,
  showMonth = true,
  query,
  right,
  children,
  contentStyle,
}) {
  const refreshing = Boolean(query?.isRefetching);
  const loading = Boolean(query?.isLoading);
  const error = query?.error;

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <View style={st.header}>
        <View style={st.headerText}>
          <Text style={st.title}>{title}</Text>
          {showMonth ? <MonthPicker /> : null}
        </View>
        {right}
      </View>

      <ScrollView
        contentContainerStyle={[st.content, contentStyle]}
        refreshControl={
          query?.refetch ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={query.refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {error ? <ErrorState error={error} onRetry={query?.refetch} /> : null}
        {loading && !error ? <LoadingState /> : null}
        {!loading && !error ? children : null}
      </ScrollView>

      <AssistantFab />
    </SafeAreaView>
  );
}

/** Seletor de mês. No web era um <select>; aqui, uma folha de opções. */
function MonthPicker() {
  const { month, setMonth, months } = useMonth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Mês selecionado: ${monthLabel(month)}. Toque para trocar.`}
        style={({ pressed }) => [st.monthBtn, pressed && st.pressed]}
      >
        <Text style={st.monthText}>{monthLabel(month)}</Text>
        <Icon name="ChevronDown" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={st.sheet} edges={["bottom"]}>
          <View style={st.grabber} />
          <Text style={st.sheetTitle}>Escolha o mês</Text>
          <ScrollView style={st.sheetList}>
            {[...months].reverse().map((m) => {
              const active = m === month;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMonth(m);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [st.option, pressed && st.pressed]}
                >
                  <Text style={[st.optionText, active && st.optionActive]}>
                    {monthLabel(m)}
                  </Text>
                  {active ? <Icon name="Check" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
            {months.length === 0 ? (
              <Text style={st.sheetEmpty}>Nenhum mês disponível ainda.</Text>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: { gap: 2, flexShrink: 1 },
  title: { fontSize: font.xl, fontWeight: "700", color: colors.text },

  monthBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 32,
  },
  monthText: { fontSize: font.sm, color: colors.textMuted },

  // Folga embaixo para o botão flutuante da assistente não cobrir a última linha.
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.lg,
    paddingBottom: FAB_SIZE + spacing.lg * 2,
  },

  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: "60%",
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sheetList: { marginBottom: spacing.md },
  option: {
    minHeight: TOUCH_TARGET + 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: font.md, color: colors.text },
  optionActive: { fontWeight: "700", color: colors.primary },
  sheetEmpty: { fontSize: font.sm, color: colors.textMuted, paddingVertical: spacing.lg },
  pressed: { opacity: 0.6 },
});
