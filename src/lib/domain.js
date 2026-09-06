/**
 * Constantes de domínio, portadas de _reference/meu-caixa.jsx (linhas 11-83).
 *
 * Diferença central em relação ao web: `icon` aqui é um IDENTIFICADOR STRING,
 * não um componente React. No web os dados de domínio carregavam componentes
 * do lucide-react dentro do campo `icon`, o que impedia reaproveitá-los fora
 * da camada de UI. A resolução string -> componente acontece em
 * src/components/Icon.jsx.
 */

export const FALLBACK_COLOR = "#64748B";

/* ---------- categorias de gasto ---------- */
export const CATS = [
  { name: "Moradia", color: "#2E7D6B", icon: "Home" },
  { name: "Educação", color: "#3B6EA5", icon: "GraduationCap" },
  { name: "Saúde", color: "#C65D7B", icon: "HeartPulse" },
  { name: "Casa / Utilidades", color: "#E8873C", icon: "Lightbulb" },
  { name: "Telefonia", color: "#1098AD", icon: "Smartphone" },
  { name: "Impostos", color: "#7A5AF8", icon: "Landmark" },
  { name: "Transporte", color: "#2F9E44", icon: "Car" },
  { name: "Cartões / Financeiro", color: "#D6493B", icon: "CreditCard" },
  { name: "Assinaturas / Serviços", color: "#B5892E", icon: "Repeat" },
  { name: "Lazer / Hobbies", color: "#E64980", icon: "Gamepad2" },
];

const CAT_FALLBACK = { color: FALLBACK_COLOR, icon: "Tag" };

export const catMeta = (n) =>
  CATS.find((c) => c.name === n) || { name: n, ...CAT_FALLBACK };

export const CARTOES_CATEGORY = "Cartões / Financeiro";

/* ---------- formas de pagamento ---------- */
export const PAYMENT_METHODS = [
  "Pix",
  "Cartão Nubank Fran",
  "Cartão Nubank Andrews",
  "Cartão Sams",
  "Cartão Renner",
];

export const PAYMENT_METHOD_FALLBACK = "Sem forma de pagamento";

/* "pix", "nubank" e "samsclub" são SVGs próprios (react-native-svg);
   os demais vêm do lucide-react-native. */
const PAYMENT_METHOD_META = {
  "Pix": { icon: "pix", color: "#77B6A8" },
  "Cartão Nubank Fran": { icon: "nubank", color: "#820AD1" },
  "Cartão Nubank Andrews": { icon: "nubank", color: "#820AD1" },
  "Cartão Sams": { icon: "samsclub", color: "#0067A0" },
  "Cartão Renner": { icon: "Shirt", color: "#E4002B" },
};

const PAYMENT_METHOD_FALLBACK_META = { icon: "CreditCard", color: FALLBACK_COLOR };

export const paymentMethodMeta = (name) =>
  PAYMENT_METHOD_META[name] || PAYMENT_METHOD_FALLBACK_META;

/* ---------- categorias do Serasa ---------- */
export const SERASA_CATS = [
  { name: "Cartão de crédito", color: "#D6493B", icon: "CreditCard" },
  { name: "Empréstimo", color: "#7A5AF8", icon: "HandCoins" },
  { name: "Financiamento", color: "#1098AD", icon: "FileText" },
  { name: "Conta atrasada", color: "#E8873C", icon: "AlertTriangle" },
  { name: "Outros", color: FALLBACK_COLOR, icon: "Tag" },
];

export const serasaCatMeta = (n) =>
  SERASA_CATS.find((c) => c.name === n) || { name: n, ...CAT_FALLBACK };

/* ---------- calculadora de seleção ---------- */
/* direction: +1 entra, -1 sai */
export const SELECTION_SOURCES = {
  expense: { direction: -1, one: "gasto", many: "gastos" },
  income: { direction: 1, one: "ganho", many: "ganhos" },
  wish: { direction: -1, one: "desejo", many: "desejos" },
  mercado: { direction: -1, one: "item de mercado", many: "itens de mercado" },
  farmacia: { direction: -1, one: "item de farmácia", many: "itens de farmácia" },
  serasa: { direction: -1, one: "dívida", many: "dívidas" },
};

export const selKey = (kind, id) => `${kind}:${id}`;

/* ---------- listas de compras ---------- */
export const SHOPPING_LISTS = [
  { type: "mercado", label: "Mercado" },
  { type: "farmacia", label: "Farmácia" },
];
