import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenShell } from "../components/ScreenShell";
import { Section } from "../components/Section";
import { Row } from "../components/Row";
import { Empty, ErrorState, Money } from "../components/ui";
import { Icon } from "../components/Icon";
import { useMonth } from "../state/MonthContext";
import { useMonthData, useUpdateExpense } from "../api/hooks";
import { groupExpenses, totalGastos } from "../lib/calc";
import { todayISO } from "../lib/format";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

export default function GastosScreen() {
  const { month } = useMonth();
  const query = useMonthData(month);
  const updateExpense = useUpdateExpense(month);

  const [search, setSearch] = useState("");
  const [hidePaid, setHidePaid] = useState(false);

  const expenses = query.data?.expenses ?? [];

  /**
   * O filtro é uma LENTE: reduz o que se vê, nunca o total do mês. O total
   * abaixo soma a coleção completa — buscar não pode dar a impressão de que
   * você gastou menos. Mesma decisão do web (comentário em meu-caixa.jsx:429).
   */
  const total = useMemo(() => totalGastos(expenses), [expenses]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = expenses.filter((e) => {
      if (hidePaid && e.paidAt) return false;
      if (!term) return true;
      return (
        String(e.description || "").toLowerCase().includes(term) ||
        String(e.category || "").toLowerCase().includes(term) ||
        String(e.paymentMethod || "").toLowerCase().includes(term)
      );
    });
    return groupExpenses(visible);
  }, [expenses, search, hidePaid]);

  const visibleTotal = useMemo(
    () => groups.reduce((s, g) => s + g.subtotal, 0),
    [groups]
  );

  const filtering = search.trim().length > 0 || hidePaid;

  const togglePaid = (expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateExpense.mutate({
      id: expense.id,
      patch: { paidAt: expense.paidAt ? null : todayISO() },
    });
  };

  return (
    <ScreenShell title="Gastos" query={query}>
      <View style={st.summary}>
        <Text style={st.summaryLabel}>Total do mês</Text>
        <Money value={total} tone="expense" size={font.xxl} />
        {filtering ? (
          <Text style={st.summaryFiltered}>
            Exibindo <Money value={visibleTotal} size={font.sm} /> com os filtros ativos
          </Text>
        ) : null}
      </View>

      <View style={st.filters}>
        <View style={st.searchBox}>
          <Icon name="Search" size={16} color={colors.textSubtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar gasto, categoria ou cartão"
            placeholderTextColor={colors.textSubtle}
            style={st.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <Pressable
          onPress={() => setHidePaid((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: hidePaid }}
          accessibilityLabel="Ocultar gastos pagos"
          style={({ pressed }) => [st.chip, hidePaid && st.chipOn, pressed && st.pressed]}
        >
          <Icon
            name="Check"
            size={14}
            color={hidePaid ? colors.textOnPrimary : colors.textMuted}
          />
          <Text style={[st.chipText, hidePaid && st.chipTextOn]}>Ocultar pagos</Text>
        </Pressable>
      </View>

      {/* Falha ao marcar como pago precisa aparecer: sem isso o item volta ao
          estado anterior no próximo refresh sem nenhuma explicação. */}
      <ErrorState
        error={updateExpense.error}
        compact
        onRetry={() => updateExpense.reset()}
      />

      {groups.length === 0 ? (
        <Empty
          icon="Wallet"
          label={
            expenses.length === 0
              ? "Nenhum gasto lançado neste mês."
              : "Nenhum gasto corresponde ao filtro."
          }
        />
      ) : (
        groups.map((g) => (
          <Section
            key={g.name}
            name={g.name}
            icon={g.icon}
            color={g.color}
            subtotal={g.subtotal}
            count={g.items.length}
          >
            {g.items.map((e) => (
              <Row
                key={e.id}
                title={e.description}
                subtitle={e.paymentMethod}
                value={e.value}
                tone="expense"
                icon={g.icon}
                iconColor={g.color}
                done={Boolean(e.paidAt)}
                dueDate={e.dueDate}
                recurrent={e.recurrent}
                installment={
                  e.installmentTotal
                    ? `parcela ${e.installmentNumber}/${e.installmentTotal}`
                    : null
                }
                onToggle={() => togglePaid(e)}
                toggleLabel={e.paidAt ? "Desmarcar pago" : "Marcar como pago"}
              />
            ))}
          </Section>
        ))
      )}
    </ScreenShell>
  );
}

const st = StyleSheet.create({
  summary: { gap: 2 },
  summaryLabel: { fontSize: font.sm, color: colors.textMuted },
  summaryFiltered: { fontSize: font.sm, color: colors.textSubtle, marginTop: spacing.xs },

  filters: { gap: spacing.sm },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  searchInput: { flex: 1, fontSize: font.md, color: colors.text, paddingVertical: 0 },

  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.sm, color: colors.textMuted },
  chipTextOn: { color: colors.textOnPrimary, fontWeight: "600" },
  pressed: { opacity: 0.6 },
});
