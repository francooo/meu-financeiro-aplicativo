/**
 * Contrato da API, em um lugar só.
 *
 * ESTADO DE DEPENDÊNCIA — importante ao rodar o app hoje:
 *
 *   [OK]     leituras (GET) e as rotas de auth já existem na API em produção.
 *   [CRIAR]  criação de UM item (POST /api/expenses, /incomes, /wishlist,
 *            /shopping) existe na branch `assistente-web` do repositório do
 *            web; vale em produção quando ela for mergeada. Exige que o mês já
 *            exista (senão 404) e devolve { ok, id, created }.
 *   [FASE A] as demais escritas granulares (PATCH/DELETE/reorder por item)
 *            ainda não existem. Até lá devolvem 404 — o cliente reporta isso
 *            com mensagem clara em vez de quebrar com erro de parse.
 *
 * Nenhuma regra de negócio mora aqui. Recorrência, parcelas e propagação entre
 * meses são decididas pelo servidor (server/db.js::createMonth).
 */

import { api, qs } from "./client";

/* ---------- diagnóstico ---------- */

/** [FASE A] Responde "é o servidor ou é meu celular?" sem investigação. */
export const health = () => api.get("/api/health");

/* ---------- autenticação ---------- */

/**
 * Troca o ID token do Google por uma sessão.
 *
 * `client: "mobile"` é o que autoriza a API a devolver o JWT no CORPO da
 * resposta. Para o navegador ela devolve apenas o cookie httpOnly — mandar o
 * token no corpo ali anularia a proteção contra XSS.
 */
export const loginWithGoogle = (credential) =>
  api.post("/api/auth/google", { credential, client: "mobile" });

export const me = () => api.get("/api/auth/me");

export const logout = () => api.post("/api/auth/logout");

/* ---------- meses ---------- */

export const getMonths = () => api.get("/api/months");

/** O servidor propaga recorrentes e parcelas do mês anterior. */
export const createMonth = (month) => api.post("/api/months", { month });

/* ---------- dados do mês ---------- */

export const getData = (month) => api.get(`/api/data${qs({ month })}`);

export const getPaymentMethods = () => api.get("/api/payment-methods");

/* ---------- gastos ---------- */

/**
 * [CRIAR] O `id` é gerado pelo cliente e enviado no corpo.
 *
 * Isso é o que torna o create idempotente: a API faz ON CONFLICT DO NOTHING, e
 * um reenvio com o MESMO id devolve a linha existente em vez de duplicar. É a
 * proteção mais importante do app — o modo de falha real no celular não é
 * edição simultânea, é "a requisição chegou, a resposta se perdeu, o usuário
 * tocou de novo". Quem chamar precisa REUSAR o id ao repetir.
 */
export const createExpense = (expense) => api.post("/api/expenses", expense);

/** [FASE A] Patch parcial: só as colunas enviadas mudam. */
export const updateExpense = (id, patch) => api.patch(`/api/expenses/${id}`, patch);

/** [FASE A] Idempotente: apagar algo já apagado não é erro. */
export const deleteExpense = (id) => api.del(`/api/expenses/${id}`);

/** [FASE A] `ids` na ordem final do grupo; o servidor só materializa posições. */
export const reorderExpenses = (month, ids) =>
  api.post("/api/expenses/reorder", { month, ids });

/** [OK] Rota granular que já existia antes do plano. */
export const moveExpenseToMonth = (id, month) =>
  api.put(`/api/expenses/${id}/month`, { month });

/* ---------- ganhos ---------- */

export const createIncome = (income) => api.post("/api/incomes", income);
export const updateIncome = (id, patch) => api.patch(`/api/incomes/${id}`, patch);
export const deleteIncome = (id) => api.del(`/api/incomes/${id}`);

/* ---------- desejos ---------- */

export const getWishlist = () => api.get("/api/wishlist");
export const createWish = (item) => api.post("/api/wishlist", item);
export const updateWish = (id, patch) => api.patch(`/api/wishlist/${id}`, patch);
export const deleteWish = (id) => api.del(`/api/wishlist/${id}`);
export const reorderWishlist = (ids) => api.post("/api/wishlist/reorder", { ids });

/* ---------- listas de compras ---------- */

export const getShoppingList = (list) => api.get(`/api/shopping${qs({ list })}`);

export const createShoppingItem = (list, item) =>
  api.post(`/api/shopping${qs({ list })}`, item);

/** Sem `?list=`: o id é chave primária global na tabela. */
export const updateShoppingItem = (id, patch) => api.patch(`/api/shopping/${id}`, patch);
export const deleteShoppingItem = (id) => api.del(`/api/shopping/${id}`);

/**
 * [FASE A] Limpar concluídos é declarativo: o servidor decide o que apagar a
 * partir do predicado (done_at IS NOT NULL), em vez de receber uma lista do
 * cliente. Assim um item criado no outro dispositivo há 2 segundos sobrevive.
 */
export const clearDoneShoppingItems = (list) => api.del(`/api/shopping/done${qs({ list })}`);

/* ---------- assistente ---------- */

/**
 * [FASE B] Assistente financeira. A chamada à Groq acontece NA API, que guarda
 * GROQ_API_KEY nas variáveis da Vercel; a chave nunca entra no app
 * (invariante 2). Até o backend ser publicado, estas rotas respondem 404.
 *
 * A API só PROPÕE: devolve `{ reply, proposal? }`. Quem grava é o app, pelas
 * mesmas rotas granulares de sempre, depois da confirmação do usuário.
 */
const ASSISTANT_TIMEOUT_MS = 30000;

export const assistantChat = ({ messages, month, today }) =>
  api.post("/api/assistant/chat", { messages, month, today }, { timeout: ASSISTANT_TIMEOUT_MS });

/** `uri` é o arquivo .m4a gravado pelo expo-audio. Devolve `{ text }`. */
export const assistantTranscribe = (uri) => {
  const form = new FormData();
  form.append("audio", { uri, name: "audio.m4a", type: "audio/m4a" });
  return api.post("/api/assistant/transcribe", form, { timeout: ASSISTANT_TIMEOUT_MS });
};

/* ---------- serasa ---------- */

export const getSerasa = () => api.get("/api/serasa");
export const createSerasaItem = (item) => api.post("/api/serasa", item);
export const updateSerasaItem = (id, patch) => api.patch(`/api/serasa/${id}`, patch);
export const deleteSerasaItem = (id) => api.del(`/api/serasa/${id}`);
export const reorderSerasa = (ids) => api.post("/api/serasa/reorder", { ids });
