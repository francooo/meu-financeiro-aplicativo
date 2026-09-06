import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenShell } from "../components/ScreenShell";
import { Card, Empty, Money } from "../components/ui";
import { Icon } from "../components/Icon";
import { useAuth } from "../auth/AuthContext";
import { useMonth } from "../state/MonthContext";
import { useMonthData } from "../api/hooks";
import {
  byCategory,
  carteiraCltPj,
  totalGanhos,
  totalGastos,
  valeAlimentacao,
} from "../lib/calc";
import { fmt, formatRelativeTime } from "../lib/format";
import { colors, font, heroGradient, radius, spacing } from "../lib/theme";

export default function OverviewScreen() {
  const { month } = useMonth();
  const { email, signOut } = useAuth();
  const query = useMonthData(month);

  const confirmSignOut = () =>
    Alert.alert("Sair do aplicativo?", email ? `Conta: ${email}` : undefined, [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut },
    ]);

  const expenses = query.data?.expenses ?? [];
  const incomes = query.data?.incomes ?? [];

  const gastos = useMemo(() => totalGastos(expenses), [expenses]);
  const ganhos = useMemo(() => totalGanhos(incomes), [incomes]);
  const saldo = ganhos - gastos;

  const va = useMemo(() => valeAlimentacao(expenses, incomes), [expenses, incomes]);
  const cltPj = useMemo(() => carteiraCltPj(expenses, incomes), [expenses, incomes]);

  const cats = useMemo(() => byCategory(expenses), [expenses]);
  const maxCat = cats[0]?.value ?? 0;

  const maiores = useMemo(
    () => [...expenses].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
    [expenses]
  );

  const recentes = useMemo(
    () =>
      [...expenses]
        .filter((e) => e.createdAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [expenses]
  );

  return (
    <ScreenShell
      title="Visão geral"
      query={query}
      right={
        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          hitSlop={8}
          style={({ pressed }) => [st.logout, pressed && { opacity: 0.6 }]}
        >
          <Icon name="LogOut" size={18} color={colors.textMuted} />
        </Pressable>
      }
    >
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.hero}
      >
        <Text style={st.heroLabel}>Saldo do mês</Text>
        <Text style={st.heroValue}>{fmt(saldo)}</Text>
        <View style={st.heroSplit}>
          <View style={st.heroItem}>
            <Icon name="ArrowUpRight" size={15} color="#86EFAC" />
            <Text style={st.heroItemLabel}>Entrou</Text>
            <Text style={st.heroItemValue}>{fmt(ganhos)}</Text>
          </View>
          <View style={st.heroDivider} />
          <View style={st.heroItem}>
            <Icon name="ArrowDownRight" size={15} color="#FCA5A5" />
            <Text style={st.heroItemLabel}>Saiu</Text>
            <Text style={st.heroItemValue}>{fmt(gastos)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={st.wallets}>
        <Wallet
          title="Vale alimentação"
          icon="ShoppingCart"
          received={va.recebido}
          used={va.usado}
          left={va.restante}
          usedLabel="Usado"
          leftLabel="Restante"
        />
        <Wallet
          title="CLT-PJ"
          icon="Landmark"
          received={cltPj.recebido}
          used={cltPj.gasto}
          left={cltPj.sobra}
          usedLabel="Gasto"
          leftLabel="Sobra"
        />
      </View>

      <Card>
        <Text style={st.cardTitle}>Para onde vai o dinheiro</Text>
        {cats.length === 0 ? (
          <Empty icon="Tag" label="Sem gastos para distribuir." />
        ) : (
          <View style={st.bars}>
            {cats.map((c) => (
              <View key={c.name} style={st.bar}>
                <View style={st.barHead}>
                  <Icon name={c.icon} size={14} color={c.color} />
                  <Text style={st.barName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Money value={c.value} size={font.sm} />
                </View>
                <View style={st.track}>
                  <View
                    style={[
                      st.fill,
                      {
                        backgroundColor: c.color,
                        width: `${maxCat > 0 ? (c.value / maxCat) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={st.cardTitle}>Maiores gastos</Text>
        {maiores.length === 0 ? (
          <Empty icon="Wallet" label="Nenhum gasto lançado." />
        ) : (
          maiores.map((e) => (
            <View key={e.id} style={st.miniRow}>
              <Text style={st.miniText} numberOfLines={1}>
                {e.description}
              </Text>
              <Money value={e.value} size={font.sm} tone="expense" />
            </View>
          ))
        )}
      </Card>

      {recentes.length > 0 ? (
        <Card>
          <Text style={st.cardTitle}>Adicionados recentemente</Text>
          {recentes.map((e) => (
            <View key={e.id} style={st.miniRow}>
              <View style={st.miniStack}>
                <Text style={st.miniText} numberOfLines={1}>
                  {e.description}
                </Text>
                <Text style={st.miniMeta}>{formatRelativeTime(e.createdAt)}</Text>
              </View>
              <Money value={e.value} size={font.sm} tone="expense" />
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenShell>
  );
}

function Wallet({ title, icon, received, used, left, usedLabel, leftLabel }) {
  return (
    <Card style={st.wallet}>
      <View style={st.walletHead}>
        <Icon name={icon} size={16} color={colors.primary} />
        <Text style={st.walletTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Money value={left} size={font.lg} tone={left < 0 ? "expense" : "income"} />
      <Text style={st.walletMeta}>{leftLabel}</Text>
      <View style={st.walletSplit}>
        <Text style={st.walletSmall}>Recebido {fmt(received)}</Text>
        <Text style={st.walletSmall}>
          {usedLabel} {fmt(used)}
        </Text>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  logout: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },

  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xs },
  heroLabel: { color: "rgba(255,255,255,0.75)", fontSize: font.sm },
  heroValue: { color: "#FFFFFF", fontSize: 34, fontWeight: "700" },
  heroSplit: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  heroItem: { flex: 1, gap: 2 },
  heroItemLabel: { color: "rgba(255,255,255,0.7)", fontSize: font.xs },
  heroItemValue: { color: "#FFFFFF", fontSize: font.md, fontWeight: "600" },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: spacing.lg,
  },

  wallets: { flexDirection: "row", gap: spacing.md },
  wallet: { flex: 1, gap: 2, padding: spacing.md },
  walletHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  walletTitle: { fontSize: font.xs, fontWeight: "700", color: colors.textMuted, flexShrink: 1 },
  walletMeta: { fontSize: font.xs, color: colors.textSubtle },
  walletSplit: { marginTop: spacing.sm, gap: 1 },
  walletSmall: { fontSize: font.xs, color: colors.textSubtle },

  cardTitle: {
    fontSize: font.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },

  bars: { gap: spacing.md },
  bar: { gap: spacing.xs },
  barHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barName: { flex: 1, fontSize: font.sm, color: colors.text },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },

  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  miniStack: { flex: 1, gap: 1 },
  miniText: { flex: 1, fontSize: font.sm, color: colors.text },
  miniMeta: { fontSize: font.xs, color: colors.textSubtle },
});
