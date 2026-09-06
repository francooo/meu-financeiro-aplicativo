/**
 * Formatadores puros, portados de _reference/meu-caixa.jsx (linhas 90-130).
 *
 * Atravessam do web para o React Native sem alteração: o Hermes do Expo SDK 57
 * traz ICU completo, então Intl.NumberFormat e toLocaleDateString funcionam.
 * Módulo sem nenhuma dependência — mantenha assim.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const fmt = (n) => brl.format(Number(n) || 0);

/** Data local do dispositivo em AAAA-MM-DD. */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/** AAAA-MM-DD -> DD/MM/AAAA */
export const formatDateBR = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const formatRelativeTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `há ${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "ontem";
  if (diffDay < 7) return `há ${diffDay} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

/** Date -> "AAAA-MM" */
export const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** "2026-03" -> "Março de 2026" */
export const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "2026-03" -> curto: "Mar/26" (para a tab bar e chips, onde não cabe o longo) */
export const monthLabelShort = (key) => {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
  const mes = s.replace(".", "");
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}/${String(y).slice(2)}`;
};

export const addMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
};

export const currentMonth = () => monthKey(new Date());

/**
 * Máscara de moeda para entrada no teclado numérico.
 * O usuário digita só dígitos e o valor cresce da direita para a esquerda,
 * evitando alternar entre teclado numérico e de símbolos no celular.
 */
export const digitsToAmount = (digits) => {
  const onlyDigits = String(digits).replace(/\D/g, "");
  return onlyDigits ? Number(onlyDigits) / 100 : 0;
};

export const amountToDigits = (value) => {
  const n = Number(value) || 0;
  return String(Math.round(n * 100));
};
