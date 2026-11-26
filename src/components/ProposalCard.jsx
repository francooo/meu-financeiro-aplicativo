import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Icon } from "./Icon";
import { ErrorState, Money, PrimaryButton } from "./ui";
import {
  useCreateExpense,
  useCreateIncome,
  useCreateShoppingItem,
  useCreateWish,
} from "../api/hooks";
import { useMonth } from "../state/MonthContext";
import { useAssistant } from "../assistant/AssistantContext";
import { ACTIONS, LIST_LABELS, buildPayload } from "../assistant/proposal";
import { catMeta } from "../lib/domain";
import { formatDateBR, monthLabel } from "../lib/format";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

/**
 * Cartão de confirmação de uma proposta da assistente.
 *
 * Nada é gravado sem o toque em "Confirmar". A gravação usa as MESMAS mutações
 * das telas, então invalida as mesmas queries e a aba correspondente se
 * atualiza sozinha.
 *
 * Retry: o payload é montado com `proposal.clientId`, fixado quando a proposta
 * chegou. "Tentar novamente" reenvia o mesmo id e a API faz ON CONFLICT DO
 * NOTHING — um retry depois de "a resposta se perdeu" não duplica o gasto.
 */
export function ProposalCard({ message }) {
  const { proposal } = message;
  const { action, data = {}, clientId, status } = proposal;
  const { month: selectedMonth } = useMonth();
  const { settleProposal } = useAssistant();

  const month = data.month || selectedMonth;
  const list = data.list === "farmacia" ? "farmacia" : "mercado";

  // Hooks sempre chamados na mesma ordem; a ação escolhe qual usar.
  const createExpense = useCreateExpense(month);
  const createIncome = useCreateIncome(month);
  const createShopping = useCreateShoppingItem(list);
  const createWish = useCreateWish();

  const mutation =
    action === "create_expense"
      ? createExpense
      : action === "create_income"
        ? createIncome
        : data.list === "wishlist"
          ? createWish
          : createShopping;

  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mutation.mutate(buildPayload(action, data, clientId), {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        settleProposal(message.id, "saved", `${ACTIONS[action].done} ✓`);
      },
    });
  };

  const cancel = () => {
    mutation.reset();
    settleProposal(message.id, "cancelled", "Tudo bem, descartei.");
  };

  return (
    <View style={[st.card, status !== "pending" && st.cardSettled]}>
      <Text style={st.kicker}>
        {ACTIONS[action].label}
        {action !== "create_list_item" ? ` · ${monthLabel(month)}` : ""}
      </Text>

      {action === "create_expense" ? <ExpenseFields data={data} /> : null}
      {action === "create_income" ? <IncomeFields data={data} /> : null}
      {action === "create_list_item" ? <ListFields data={data} /> : null}

      {status === "saved" ? (
        <View style={st.outcome}>
          <Icon name="Check" size={16} color={colors.income} />
          <Text style={[st.outcomeText, { color: colors.income }]}>Lançado</Text>
        </View>
      ) : status === "cancelled" ? (
        <Text style={st.outcomeText}>Descartado</Text>
      ) : (
        <>
          <ErrorState error={mutation.error} compact onRetry={confirm} />
          <View style={st.actions}>
            <Pressable
              onPress={cancel}
              disabled={mutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={({ pressed }) => [st.secondary, pressed && st.pressed]}
            >
              <Text style={st.secondaryText}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label="Confirmar"
              icon="Check"
              onPress={confirm}
              loading={mutation.isPending}
              style={st.primary}
            />
          </View>
        </>
      )}
    </View>
  );
}

/* ---------- campos por tipo ---------- */

function ExpenseFields({ data }) {
  const meta = catMeta(data.category);
  const tags = [];
  if (data.paidWithCltPj) tags.push("Desconta do CLT-PJ");
  if (data.paidWithVoucher) tags.push("Vale");
  if (data.repeat === "recurrent") tags.push("Recorrente");
  if (data.repeat === "installments") tags.push(`${data.installmentTotal}x parcelado`);

  return (
    <>
      <Headline title={data.description} value={data.value} tone="expense" />
      <Field icon={meta.icon} iconColor={meta.color} label="Categoria" value={data.category} />
      {data.paymentMethod ? (
        <Field icon="CreditCard" label="Pagamento" value={data.paymentMethod} />
      ) : null}
      {data.dueDate ? (
        <Field icon="History" label="Vencimento" value={formatDateBR(data.dueDate)} />
      ) : null}
      {data.note ? <Field icon="Pencil" label="Obs." value={data.note} /> : null}
      <Tags items={tags} />
    </>
  );
}

function IncomeFields({ data }) {
  const tags = [];
  if (data.cltPjIncome) tags.push("CLT-PJ");
  if (data.voucherIncome) tags.push("Vale");
  if (data.recurrent) tags.push("Recorrente");

  return (
    <>
      <Headline title={data.source} value={data.value} tone="income" />
      {data.receiptDate ? (
        <Field icon="History" label="Recebimento" value={formatDateBR(data.receiptDate)} />
      ) : null}
      {data.note ? <Field icon="Pencil" label="Obs." value={data.note} /> : null}
      <Tags items={tags} />
    </>
  );
}

function ListFields({ data }) {
  return (
    <>
      <Headline title={data.title} value={data.value} tone="expense" hideZero />
      <Field icon="ShoppingCart" label="Lista" value={LIST_LABELS[data.list] || data.list} />
      {data.note ? <Field icon="Pencil" label="Obs." value={data.note} /> : null}
    </>
  );
}

/* ---------- peças ---------- */

function Headline({ title, value, tone, hideZero }) {
  return (
    <View style={st.headline}>
      <Text style={st.title} numberOfLines={2}>
        {title}
      </Text>
      {hideZero && !Number(value) ? null : <Money value={value} tone={tone} size={font.lg} />}
    </View>
  );
}

function Field({ icon, iconColor = colors.textMuted, label, value }) {
  return (
    <View style={st.field}>
      <Icon name={icon} size={15} color={iconColor} />
      <Text style={st.fieldLabel}>{label}</Text>
      <Text style={st.fieldValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Tags({ items }) {
  if (items.length === 0) return null;
  return (
    <View style={st.tags}>
      {items.map((t) => (
        <View key={t} style={st.tag}>
          <Text style={st.tagText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardSettled: { opacity: 0.75 },
  kicker: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: { flex: 1, fontSize: font.md, fontWeight: "700", color: colors.text },

  field: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fieldLabel: { fontSize: font.sm, color: colors.textMuted, width: 88 },
  fieldValue: { flex: 1, fontSize: font.sm, color: colors.text },

  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: font.xs, fontWeight: "600", color: colors.primary },

  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  primary: { flex: 1 },
  secondary: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: font.md, fontWeight: "600", color: colors.textMuted },

  outcome: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  outcomeText: { fontSize: font.sm, fontWeight: "600", color: colors.textMuted },
  pressed: { opacity: 0.6 },
});
