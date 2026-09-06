import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenShell } from "../components/ScreenShell";
import { Card, Empty, ErrorState, Money } from "../components/ui";
import { Row } from "../components/Row";
import {
  useShoppingList,
  useUpdateShoppingItem,
  useUpdateWish,
  useWishlist,
} from "../api/hooks";
import { groupShopping, groupWishlist } from "../lib/calc";
import { todayISO } from "../lib/format";
import { colors, font, radius, spacing } from "../lib/theme";

/**
 * Mercado, Farmácia e Desejos numa aba só.
 *
 * No web eram três abas separadas, entre sete no topo. Sete não cabem numa tab
 * bar de celular, e as três são a mesma interação (item, valor, marcar
 * concluído) — daí o segmented control em vez de três destinos de navegação.
 */

const TABS = [
  { key: "mercado", label: "Mercado", kind: "shopping" },
  { key: "farmacia", label: "Farmácia", kind: "shopping" },
  { key: "desejos", label: "Desejos", kind: "wish" },
];

export default function ListasScreen() {
  const [active, setActive] = useState("mercado");
  const current = TABS.find((t) => t.key === active);

  return (
    <Inner
      key={active}
      tabKey={active}
      kind={current.kind}
      onChangeTab={setActive}
      activeTab={active}
    />
  );
}

function Inner({ tabKey, kind, onChangeTab, activeTab }) {
  const isWish = kind === "wish";

  const shoppingQuery = useShoppingList(isWish ? null : tabKey);
  const wishQuery = useWishlist();
  const query = isWish ? wishQuery : shoppingQuery;

  const updateShopping = useUpdateShoppingItem(tabKey);
  const updateWish = useUpdateWish();
  const mutation = isWish ? updateWish : updateShopping;

  const items = query.data ?? [];
  const groups = useMemo(
    () => (isWish ? groupWishlist(items) : groupShopping(items)),
    [items, isWish]
  );

  const toggle = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mutation.mutate({
      id: item.id,
      patch: { doneAt: item.doneAt ? null : todayISO() },
    });
  };

  const pendingTotal = isWish
    ? groups.pending.reduce((s, i) => s + (Number(i.value) || 0), 0)
    : groups.totalPending;

  return (
    <ScreenShell title="Listas" showMonth={false} query={query}>
      <View style={st.segmented}>
        {TABS.map((t) => {
          const on = t.key === activeTab;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChangeTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [st.segment, on && st.segmentOn, pressed && st.pressed]}
            >
              <Text style={[st.segmentText, on && st.segmentTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={st.summary}>
        <Text style={st.summaryLabel}>
          {isWish ? "Total dos desejos pendentes" : "Total estimado"}
        </Text>
        <Money value={pendingTotal} size={font.xl} />
      </View>

      <ErrorState error={mutation.error} compact onRetry={() => mutation.reset()} />

      {groups.pending.length === 0 && groups.done.length === 0 ? (
        <Empty
          icon={isWish ? "PiggyBank" : "ShoppingCart"}
          label={isWish ? "Nenhum desejo na lista." : "Lista vazia."}
        />
      ) : null}

      {groups.pending.length > 0 ? (
        <Card style={st.list}>
          <Text style={st.groupTitle}>
            {isWish ? "Pendentes" : "A comprar"} · {groups.pending.length}
          </Text>
          {groups.pending.map((it) => (
            <Row
              key={it.id}
              title={it.title}
              subtitle={it.note || null}
              value={it.value}
              icon={isWish ? "PiggyBank" : "ShoppingCart"}
              iconColor={colors.primary}
              onToggle={() => toggle(it)}
              toggleLabel={isWish ? "Marcar como realizado" : "Marcar como comprado"}
            />
          ))}
        </Card>
      ) : null}

      {groups.done.length > 0 ? (
        <Card style={st.list}>
          <Text style={st.groupTitle}>
            {isWish ? "Realizados" : "Comprados"} · {groups.done.length}
          </Text>
          {groups.done.map((it) => (
            <Row
              key={it.id}
              title={it.title}
              subtitle={it.note || null}
              value={it.value}
              icon="Check"
              iconColor={colors.income}
              done
              onToggle={() => toggle(it)}
              toggleLabel="Desmarcar"
            />
          ))}
        </Card>
      ) : null}
    </ScreenShell>
  );
}

const st = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.sm, color: colors.textMuted, fontWeight: "600" },
  segmentTextOn: { color: colors.textOnPrimary },

  summary: { gap: 2 },
  summaryLabel: { fontSize: font.sm, color: colors.textMuted },

  list: { paddingVertical: spacing.sm },
  groupTitle: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.textSubtle,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  pressed: { opacity: 0.6 },
});
