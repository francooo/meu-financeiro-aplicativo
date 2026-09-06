import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "../components/Icon";
import OverviewScreen from "../screens/OverviewScreen";
import GastosScreen from "../screens/GastosScreen";
import GanhosScreen from "../screens/GanhosScreen";
import ListasScreen from "../screens/ListasScreen";
import SerasaScreen from "../screens/SerasaScreen";
import { colors, font } from "../lib/theme";

/**
 * As 7 abas do web viram 5 abas nativas.
 *
 * Sete não cabem numa tab bar de celular, e abas roláveis no topo — como no web
 * (_reference/meu-caixa.jsx:857-865) — ficam fora do alcance do polegar.
 * Mercado, Farmácia e Desejos foram agrupados em "Listas" porque são a mesma
 * interação; a navegação entre eles é um segmented control dentro da tela.
 */

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

const TABS = [
  { name: "Visão geral", component: OverviewScreen, icon: "Wallet" },
  { name: "Gastos", component: GastosScreen, icon: "ArrowDownRight" },
  { name: "Ganhos", component: GanhosScreen, icon: "ArrowUpRight" },
  { name: "Listas", component: ListasScreen, icon: "ShoppingCart" },
  { name: "Serasa", component: SerasaScreen, icon: "FileText" },
];

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSubtle,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontSize: font.xs, fontWeight: "600" },
          // A tab bar já respeita a barra de gestos via safe-area-context.
          tabBarHideOnKeyboard: true,
        }}
      >
        {TABS.map((t) => (
          <Tab.Screen
            key={t.name}
            name={t.name}
            component={t.component}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name={t.icon} size={size ?? 22} color={color} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
