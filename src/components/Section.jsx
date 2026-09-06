import { StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";
import { Money } from "./ui";
import { colors, font, radius, shadow, spacing } from "../lib/theme";

/** Grupo de itens com cabeçalho colorido e subtotal (categoria, forma de pagamento). */
export function Section({ name, icon, color = colors.textMuted, subtotal, count, children }) {
  return (
    <View style={st.card}>
      <View style={st.header}>
        <View style={[st.icon, { backgroundColor: `${color}1A` }]}>
          <Icon name={icon} size={16} color={color} />
        </View>
        <View style={st.headerText}>
          <Text style={st.name} numberOfLines={1}>
            {name}
          </Text>
          {count != null ? (
            <Text style={st.count}>
              {count} {count === 1 ? "item" : "itens"}
            </Text>
          ) : null}
        </View>
        {subtotal != null ? <Money value={subtotal} size={font.md} /> : null}
      </View>
      <View style={st.body}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    height: 30,
    width: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  name: { fontSize: font.md, fontWeight: "700", color: colors.text },
  count: { fontSize: font.xs, color: colors.textSubtle },
  body: { gap: 0 },
});
