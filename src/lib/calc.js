/**
 * Cálculos de negócio de apresentação, extraídos dos useMemo presos dentro do
 * componente App do web (_reference/meu-caixa.jsx, linhas 426-590).
 *
 * São funções puras: recebem as coleções e devolvem o resultado. Isso as torna
 * testáveis e reutilizáveis entre telas — no web cada uma existia apenas dentro
 * de um hook, inacessível fora daquele componente.
 *
 * ATENÇÃO: estes são cálculos de EXIBIÇÃO. As regras de negócio de verdade
 * (propagação de recorrências e parcelas ao criar um mês) vivem no servidor,
 * em server/db.js::createMonth. Nada aqui deve reimplementá-las.
 */

import {
  CATS,
  SERASA_CATS,
  PAYMENT_METHODS,
  SELECTION_SOURCES,
  catMeta,
  serasaCatMeta,
  selKey,
} from "./domain";
import { todayISO } from "./format";

const num = (v) => Number(v) || 0;
const sum = (list) => (list || []).reduce((s, i) => s + num(i.value), 0);

/**
 * Comparador de ordem manual com desempate.
 * No web esta lógica estava copiada em 5 lugares (linhas 526, 556, 578, 655, 1412).
 * `order` nulo vai para o fim; o desempate é configurável porque desejos
 * desempatam por título e gastos/dívidas por valor decrescente.
 */
export const byOrder =
  (tieBreak = (a, b) => num(b.value) - num(a.value)) =>
  (a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    return tieBreak(a, b);
  };

const byOrderThenValue = byOrder();
const byOrderThenTitle = byOrder((a, b) =>
  String(a.title || "").localeCompare(String(b.title || ""))
);

/* ---------- totais ---------- */
export const totalGastos = (expenses) => sum(expenses);
export const totalGanhos = (incomes) => sum(incomes);
export const totalSerasa = (serasa) => sum(serasa);

/* ---------- carteiras ---------- */

/** Vale alimentação: recebido via ganhos marcados, usado via gastos marcados. */
export const valeAlimentacao = (expenses, incomes) => {
  const recebido = sum((incomes || []).filter((i) => i.voucherIncome));
  const usado = sum((expenses || []).filter((e) => e.paidWithVoucher));
  return { recebido, usado, restante: recebido - usado };
};

export const carteiraCltPj = (expenses, incomes) => {
  const recebido = sum((incomes || []).filter((i) => i.cltPjIncome));
  const gasto = sum((expenses || []).filter((e) => e.paidWithCltPj));
  return { recebido, gasto, sobra: recebido - gasto };
};

/**
 * Próximos recebimentos: todos os ganhos que caem na data futura mais próxima.
 * Devolve array porque pode haver mais de um ganho no mesmo dia.
 */
export const nextIncomes = (incomes) => {
  const today = todayISO();
  const upcoming = (incomes || [])
    .filter((i) => i.receiptDate && i.receiptDate >= today)
    .sort((a, b) => (a.receiptDate < b.receiptDate ? -1 : 1));
  if (upcoming.length === 0) return [];
  const nextDate = upcoming[0].receiptDate;
  return upcoming.filter((i) => i.receiptDate === nextDate);
};

/* ---------- agrupamentos ---------- */

/** Agrupa por chave, calcula subtotal e ordena grupos por subtotal desc. */
const groupBy = (items, keyOf, metaOf, itemSort) => {
  const m = new Map();
  for (const it of items || []) {
    const k = keyOf(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return [...m.entries()]
    .map(([name, list]) => ({
      name,
      ...metaOf(name),
      items: [...list].sort(itemSort),
      subtotal: sum(list),
    }))
    .sort((a, b) => b.subtotal - a.subtotal);
};

/** Distribuição por categoria, para o gráfico "para onde vai o dinheiro". */
export const byCategory = (expenses) => {
  const m = new Map();
  for (const e of expenses || []) {
    m.set(e.category, (m.get(e.category) || 0) + num(e.value));
  }
  return [...m.entries()]
    .map(([name, value]) => ({ name, value, ...catMeta(name) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
};

export const groupExpenses = (expenses) =>
  groupBy(expenses, (e) => e.category, catMeta, byOrderThenValue);

export const groupSerasa = (serasa) =>
  groupBy(serasa, (s) => s.category, serasaCatMeta, byOrderThenValue);

export const groupWishlist = (wishlist) => ({
  pending: (wishlist || []).filter((w) => !w.doneAt).sort(byOrderThenTitle),
  done: (wishlist || []).filter((w) => w.doneAt).sort(byOrderThenTitle),
});

export const groupShopping = (items) => {
  const pending = (items || []).filter((i) => !i.doneAt);
  return {
    pending,
    done: (items || []).filter((i) => i.doneAt),
    totalPending: sum(pending),
  };
};

/* ---------- categorias e formas de pagamento personalizadas ---------- */

const extras = (values, known) =>
  [...new Set(values.filter((v) => v && !known.has(v)))].sort();

export const extraExpenseCategories = (expenses) =>
  extras((expenses || []).map((e) => e.category), new Set(CATS.map((c) => c.name)));

export const extraSerasaCategories = (serasa) =>
  extras((serasa || []).map((s) => s.category), new Set(SERASA_CATS.map((c) => c.name)));

/**
 * Formas de pagamento personalizadas: as já gravadas no banco (de qualquer mês)
 * somadas às do mês carregado, para que um cartão criado uma vez continue
 * aparecendo na lista depois.
 */
export const extraPaymentMethods = (savedPaymentMethods, expenses) =>
  extras(
    [...(savedPaymentMethods || []), ...(expenses || []).map((e) => e.paymentMethod)],
    new Set(PAYMENT_METHODS)
  );

/* ---------- calculadora de seleção ---------- */

/**
 * Soma sobre as coleções COMPLETAS, nunca sobre listas já filtradas: o filtro é
 * uma lente, então buscar não pode alterar o total. A contagem usa apenas itens
 * realmente encontrados, então a chave órfã de um item excluído some sozinha da
 * conta — por isso não existe rotina de limpeza das seleções.
 */
export const selectionStats = (selectedKeys, collections) => {
  let count = 0;
  let inflow = 0;
  let outflow = 0;
  const byKind = [];

  if (selectedKeys && selectedKeys.size > 0) {
    const buckets = [
      ["expense", collections.expenses],
      ["income", collections.incomes],
      ["wish", collections.wishlist],
      ["mercado", collections.mercado],
      ["farmacia", collections.farmacia],
      ["serasa", collections.serasa],
    ];
    for (const [kind, list] of buckets) {
      let n = 0;
      for (const it of list || []) {
        if (!selectedKeys.has(selKey(kind, it.id))) continue;
        n += 1;
        const v = num(it.value);
        if (SELECTION_SOURCES[kind].direction > 0) inflow += v;
        else outflow += v;
      }
      if (n > 0) byKind.push({ kind, n });
      count += n;
    }
  }

  return {
    count,
    inflow,
    outflow,
    net: inflow - outflow,
    mixed: inflow > 0 && outflow > 0,
    byKind,
  };
};

/**
 * Com uma origem só a quebra já é a contagem ("2 gastos"); com várias, o total
 * vem na frente para sobreviver ao corte de texto em telas estreitas.
 */
export const selectionLabel = (stats) => {
  const parts = stats.byKind.map(
    ({ kind, n }) =>
      `${n} ${n === 1 ? SELECTION_SOURCES[kind].one : SELECTION_SOURCES[kind].many}`
  );
  const breakdown = parts.join(" · ");
  if (parts.length <= 1) return breakdown;
  return `${stats.count} itens · ${breakdown}`;
};
