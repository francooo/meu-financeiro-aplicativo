import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMonths } from "../api/hooks";
import { currentMonth } from "../lib/format";

/**
 * Mês selecionado, compartilhado por todas as abas.
 *
 * No web isso era um useState dentro do componente App, repassado por prop
 * drilling para 8 componentes. Aqui é contexto porque as abas do React
 * Navigation são irmãs, não filhas de um orquestrador comum.
 */

const MonthContext = createContext(null);

export function MonthProvider({ children }) {
  const [month, setMonth] = useState(currentMonth());
  const monthsQuery = useMonths();

  const months = useMemo(() => monthsQuery.data ?? [], [monthsQuery.data]);

  /**
   * Se o mês corrente ainda não existe no banco, cai no mais recente
   * disponível — do contrário a primeira abertura do app num mês novo
   * mostraria tudo vazio sem explicar por quê.
   */
  useEffect(() => {
    if (months.length === 0) return;
    if (months.includes(month)) return;
    setMonth(months[months.length - 1]);
  }, [months, month]);

  const value = useMemo(
    () => ({
      month,
      setMonth,
      months,
      monthsLoading: monthsQuery.isLoading,
      monthsError: monthsQuery.error,
      refetchMonths: monthsQuery.refetch,
    }),
    [month, months, monthsQuery.isLoading, monthsQuery.error, monthsQuery.refetch]
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth precisa estar dentro de <MonthProvider>.");
  return ctx;
}
