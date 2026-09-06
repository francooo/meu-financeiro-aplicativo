import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenShell } from "../components/ScreenShell";
import { Card, Empty, Money } from "../components/ui";
import { Row } from "../components/Row";
import { Icon } from "../components/Icon";
import { useMonth } from "../state/MonthContext";
import { useMonthData } from "../api/hooks";
import { nextIncomes, totalGanhos } from "../lib/calc";
import { formatDateBR } from "../lib/format";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

export default function GanhosScreen() {
  const { month } = useMonth();
  const query = useMonthData(month);
  const [search, setSearch] = useState("");

  const incomes = query.data?.incomes ?? [];
  const total = useMemo(() => totalGanhos(incomes), [incomes]);
  const upcoming = useMemo(() => nextIncomes(incomes), [incomes]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return incomes;
    return incomes.filter((i) =>
      String(i.source || "").toLowerCase().includes(term)
    );
  }, [incomes, search]);

  return (
    <ScreenShell title="Ganhos" query={query}>
      <View style={st.summary}>
        <Text style={st.summaryLabel}>Total do mês</Text>
        <Money value={total} tone="income" size={font.xxl} />
      </View>

      {upcoming.length > 0 ? (
        <Card style={st.alert}>
          <Icon name="History" size={18} color={colors.income} />
          <View style={st.alertText}>
            <Text style={st.alertTitle}>
              Você vai receber em {formatDateBR(upcoming[0].receiptDate)}
            </Text>
            <Text style={st.alertBody} numberOfLines={2}>
              {upcoming.map((i) => i.source).join(" · ")}
            </Text>
          </View>
          <Money
            value={upcoming.reduce((s, i) => s + (Number(i.value) || 0), 0)}
            tone="income"
          />
        </Card>
      ) : null}

      <View style={st.searchBox}>
        <Icon name="Search" size={16} color={colors.textSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar fonte de renda"
          placeholderTextColor={colors.textSubtle}
          style={st.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {visible.length === 0 ? (
        <Empty
          icon="PiggyBank"
          label={
            incomes.length === 0
              ? "Nenhum ganho lançado neste mês."
              : "Nenhum ganho corresponde à busca."
          }
        />
      ) : (
        <Card style={st.list}>
          {visible.map((i) => {
            const tags = [];
            if (i.voucherIncome) tags.push("Vale alimentação");
            if (i.cltPjIncome) tags.push("CLT-PJ");
            return (
              <Row
                key={i.id}
                title={i.source}
                subtitle={tags.join(" · ") || null}
                value={i.value}
                tone="income"
                icon="ArrowUpRight"
                iconColor={colors.income}
                recurrent={i.recurrent}
                dueDate={i.receiptDate}
              />
            );
          })}
        </Card>
      )}
    </ScreenShell>
  );
}

const st = StyleSheet.create({
  summary: { gap: 2 },
  summaryLabel: { fontSize: font.sm, color: colors.textMuted },

  alert: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  alertText: { flex: 1, gap: 2 },
  alertTitle: { fontSize: font.sm, fontWeight: "700", color: colors.text },
  alertBody: { fontSize: font.xs, color: colors.textMuted },

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

  list: { paddingVertical: spacing.sm },
});
