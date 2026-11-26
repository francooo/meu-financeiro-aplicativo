/**
 * Propostas da assistente → payload das rotas granulares.
 *
 * A API do assistente só PROPÕE (`{ action, data, missing }`); quem grava é o
 * app, pelas mesmas mutações das telas. Este módulo é puro: traduz os campos
 * que a IA devolve para o formato que cada rota espera, espelhando o submit do
 * formulário do web (_reference/meu-caixa.jsx:2476-2492).
 *
 * Nenhuma regra de negócio aqui (invariante 5): recorrência e parcelas são só
 * repassadas; quem as materializa nos meses seguintes é o servidor.
 */

export const ACTIONS = {
  create_expense: { label: "Novo gasto", done: "Gasto lançado" },
  create_income: { label: "Novo ganho", done: "Ganho lançado" },
  create_list_item: { label: "Novo item", done: "Item adicionado" },
};

export const LIST_LABELS = {
  mercado: "Mercado",
  farmacia: "Farmácia",
  wishlist: "Desejos",
};

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const text = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * Monta o corpo do create. `id` vem de fora: é gerado UMA vez, quando a
 * proposta chega, e reusado em todo retry (invariante 4).
 */
export function buildPayload(action, data, id) {
  const d = data || {};

  if (action === "create_expense") {
    const repeat = d.repeat || "none";
    const installments = repeat === "installments" ? Math.trunc(num(d.installmentTotal)) : null;
    return {
      id,
      description: text(d.description),
      category: text(d.category),
      value: num(d.value),
      note: text(d.note),
      dueDate: d.dueDate || null,
      recurrent: repeat === "recurrent",
      installmentTotal: installments,
      installmentNumber: installments ? 1 : null,
      paidWithVoucher: Boolean(d.paidWithVoucher),
      paidWithCltPj: Boolean(d.paidWithCltPj),
      paymentMethod: text(d.paymentMethod) || null,
    };
  }

  if (action === "create_income") {
    return {
      id,
      source: text(d.source),
      value: num(d.value),
      note: text(d.note),
      receiptDate: d.receiptDate || null,
      recurrent: Boolean(d.recurrent),
      voucherIncome: Boolean(d.voucherIncome),
      cltPjIncome: Boolean(d.cltPjIncome),
    };
  }

  if (action === "create_list_item") {
    return { id, title: text(d.title), value: num(d.value), note: text(d.note) };
  }

  throw new Error(`Ação desconhecida da assistente: ${action}`);
}

/** Uma proposta só vira cartão de confirmação se a ação é conhecida e nada falta. */
export const isActionable = (proposal) =>
  Boolean(proposal && ACTIONS[proposal.action] && (proposal.missing || []).length === 0);
