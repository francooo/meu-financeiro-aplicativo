import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";
import { Money } from "./ui";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";
import { formatDateBR } from "../lib/format";

/**
 * Linha de item (gasto, dívida, desejo, compra).
 *
 * Adaptação de usabilidade em relação ao web: lá a linha era densa, com setas
 * de reordenação e checkbox de poucos pixels (_reference/meu-caixa.jsx,
 * 2013-2119) — clicáveis com o mouse, inviáveis com o dedo. Aqui a linha
 * inteira é o alvo, com altura mínima de 44pt, e o toggle de "pago" é um
 * segundo alvo do mesmo tamanho.
 */
export function Row({
  title,
  subtitle,
  value,
  tone = "neutral",
  icon,
  iconColor = colors.textMuted,
  done = false,
  dueDate,
  installment,
  recurrent = false,
  onPress,
  onToggle,
  toggleLabel,
}) {
  const meta = [];
  if (dueDate) meta.push(`vence ${formatDateBR(dueDate)}`);
  if (installment) meta.push(installment);
  if (subtitle) meta.push(subtitle);

  return (
    <View style={st.wrap}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={title}
        style={({ pressed }) => [st.main, pressed && onPress && st.pressed]}
      >
        {icon ? (
          <View style={[st.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
            <Icon name={icon} size={18} color={iconColor} />
          </View>
        ) : null}

        <View style={st.text}>
          <View style={st.titleLine}>
            <Text style={[st.title, done && st.titleDone]} numberOfLines={2}>
              {title}
            </Text>
            {recurrent ? <Icon name="Repeat" size={13} color={colors.textSubtle} /> : null}
          </View>
          {meta.length > 0 ? (
            <Text style={st.meta} numberOfLines={1}>
              {meta.join(" · ")}
            </Text>
          ) : null}
        </View>

        <Money value={value} tone={tone} style={done && st.valueDone} />
      </Pressable>

      {onToggle ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={toggleLabel || (done ? "Desmarcar" : "Marcar como pago")}
          hitSlop={6}
          style={({ pressed }) => [st.toggle, done && st.toggleDone, pressed && st.pressed]}
        >
          <Icon
            name="Check"
            size={16}
            color={done ? colors.textOnPrimary : colors.textSubtle}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET + 8,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },

  iconWrap: {
    height: 34,
    width: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  title: { fontSize: font.md, color: colors.text, flexShrink: 1 },
  titleDone: { textDecorationLine: "line-through", color: colors.textSubtle },
  meta: { fontSize: font.xs, color: colors.textMuted },
  valueDone: { color: colors.textSubtle },

  toggle: {
    height: TOUCH_TARGET,
    width: TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  toggleDone: { backgroundColor: colors.income, borderColor: colors.income },
});
