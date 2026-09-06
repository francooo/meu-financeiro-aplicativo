import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenShell } from "../components/ScreenShell";
import { Section } from "../components/Section";
import { Row } from "../components/Row";
import { Empty, ErrorState, Money } from "../components/ui";
import { Icon } from "../components/Icon";
import { useSerasa, useUpdateSerasaItem } from "../api/hooks";
import { groupSerasa, totalSerasa } from "../lib/calc";
import { todayISO } from "../lib/format";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

export default function SerasaScreen() {
  const query = useSerasa();
  const update = useUpdateSerasaItem();
  const [search, setSearch] = useState("");

  const items = query.data ?? [];
  const total = useMemo(() => totalSerasa(items), [items]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = term
      ? items.filter(
          (i) =>
            String(i.description || "").toLowerCase().includes(term) ||
            String(i.category || "").toLowerCase().includes(term)
        )
      : items;
    return groupSerasa(visible);
  }, [items, search]);

  const toggle = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update.mutate({
      id: item.id,
      patch: { paidAt: item.paidAt ? null : todayISO() },
    });
  };

  return (
    <ScreenShell title="Serasa" showMonth={false} query={query}>
      <View style={st.summary}>
        <Text style={st.summaryLabel}>Total em dívidas</Text>
        <Money value={total} tone="expense" size={font.xxl} />
      </View>

      <View style={st.searchBox}>
        <Icon name="Search" size={16} color={colors.textSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar dívida ou categoria"
          placeholderTextColor={colors.textSubtle}
          style={st.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ErrorState error={update.error} compact onRetry={() => update.reset()} />

      {groups.length === 0 ? (
        <Empty
          icon="FileText"
          label={
            items.length === 0
              ? "Nenhuma dívida registrada."
              : "Nenhuma dívida corresponde à busca."
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
            {g.items.map((it) => (
              <Row
                key={it.id}
                title={it.description}
                subtitle={it.note || null}
                value={it.value}
                tone="expense"
                icon={g.icon}
                iconColor={g.color}
                done={Boolean(it.paidAt)}
                dueDate={it.dueDate}
                recurrent={it.recurrent}
                installment={
                  it.installmentTotal
                    ? `parcela ${it.installmentNumber}/${it.installmentTotal}`
                    : null
                }
                onToggle={() => toggle(it)}
                toggleLabel={it.paidAt ? "Desmarcar paga" : "Marcar como paga"}
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
});
