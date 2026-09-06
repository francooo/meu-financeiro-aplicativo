import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./endpoints";

/**
 * Hooks de acesso a dados.
 *
 * Toda mutação invalida as queries afetadas, para que a tela passe a refletir
 * o SERVIDOR e não apenas o estado local. É isso que faz uma alteração feita
 * no navegador aparecer aqui, e vice-versa.
 */

export const keys = {
  months: ["months"],
  data: (month) => ["data", month],
  paymentMethods: ["paymentMethods"],
  wishlist: ["wishlist"],
  shopping: (list) => ["shopping", list],
  serasa: ["serasa"],
};

/* ---------- leituras ---------- */

export const useMonths = () =>
  useQuery({
    queryKey: keys.months,
    queryFn: async () => (await api.getMonths())?.months ?? [],
  });

export const useMonthData = (month) =>
  useQuery({
    queryKey: keys.data(month),
    queryFn: () => api.getData(month),
    enabled: Boolean(month),
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: keys.paymentMethods,
    queryFn: async () => (await api.getPaymentMethods())?.methods ?? [],
  });

export const useWishlist = () =>
  useQuery({
    queryKey: keys.wishlist,
    queryFn: async () => (await api.getWishlist())?.items ?? [],
  });

export const useShoppingList = (list) =>
  useQuery({
    queryKey: keys.shopping(list),
    queryFn: async () => (await api.getShoppingList(list))?.items ?? [],
    enabled: Boolean(list),
  });

export const useSerasa = () =>
  useQuery({
    queryKey: keys.serasa,
    queryFn: async () => (await api.getSerasa())?.items ?? [],
  });

/* ---------- escritas ---------- */

/**
 * Fábrica de mutação com invalidação.
 *
 * Sem update otimista por enquanto: enquanto as rotas granulares não estiverem
 * publicadas (Fase A), otimismo esconderia o 404 e daria a MESMA falsa sensação
 * de sucesso que o plano identificou como o pior defeito do web. Melhor a tela
 * esperar a resposta e mostrar o erro de verdade.
 */
function useInvalidatingMutation(mutationFn, keysToInvalidate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of keysToInvalidate) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export const useCreateExpense = (month) =>
  useInvalidatingMutation((expense) => api.createExpense({ ...expense, month }), [
    keys.data(month),
    keys.paymentMethods,
    keys.months,
  ]);

export const useUpdateExpense = (month) =>
  useInvalidatingMutation(({ id, patch }) => api.updateExpense(id, patch), [
    keys.data(month),
    keys.paymentMethods,
  ]);

export const useDeleteExpense = (month) =>
  useInvalidatingMutation((id) => api.deleteExpense(id), [keys.data(month)]);

export const useCreateIncome = (month) =>
  useInvalidatingMutation((income) => api.createIncome({ ...income, month }), [
    keys.data(month),
  ]);

export const useUpdateIncome = (month) =>
  useInvalidatingMutation(({ id, patch }) => api.updateIncome(id, patch), [
    keys.data(month),
  ]);

export const useDeleteIncome = (month) =>
  useInvalidatingMutation((id) => api.deleteIncome(id), [keys.data(month)]);

export const useCreateMonth = () =>
  useInvalidatingMutation((month) => api.createMonth(month), [keys.months]);

export const useUpdateWish = () =>
  useInvalidatingMutation(({ id, patch }) => api.updateWish(id, patch), [keys.wishlist]);

export const useCreateWish = () =>
  useInvalidatingMutation((item) => api.createWish(item), [keys.wishlist]);

export const useDeleteWish = () =>
  useInvalidatingMutation((id) => api.deleteWish(id), [keys.wishlist]);

export const useUpdateShoppingItem = (list) =>
  useInvalidatingMutation(({ id, patch }) => api.updateShoppingItem(id, patch), [
    keys.shopping(list),
  ]);

export const useCreateShoppingItem = (list) =>
  useInvalidatingMutation((item) => api.createShoppingItem(list, item), [
    keys.shopping(list),
  ]);

export const useDeleteShoppingItem = (list) =>
  useInvalidatingMutation((id) => api.deleteShoppingItem(id), [keys.shopping(list)]);

export const useClearDoneShoppingItems = (list) =>
  useInvalidatingMutation(() => api.clearDoneShoppingItems(list), [keys.shopping(list)]);

export const useUpdateSerasaItem = () =>
  useInvalidatingMutation(({ id, patch }) => api.updateSerasaItem(id, patch), [
    keys.serasa,
  ]);
