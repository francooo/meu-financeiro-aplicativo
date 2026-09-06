import { AppState, Platform } from "react-native";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";

/**
 * Configuração do cache de servidor.
 *
 * É aqui que mora a sincronização entre Web e Mobile prometida no plano. Sem
 * WebSockets: ao trazer o app para o primeiro plano, o React Query revalida e
 * puxa o que foi alterado no navegador. Para dois dispositivos de um único
 * usuário, isso entrega consistência percebida como imediata a custo zero.
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Considera fresco por 30s: evita refetch a cada troca de aba. */
      staleTime: 30_000,
      /**
       * Retenção longa para que voltar a uma aba já visitada não recarregue.
       *
       * ATENÇÃO: isto é cache EM MEMÓRIA — some ao fechar o app. A leitura
       * offline de verdade (abrir o app sem sinal e ainda ver a lista de
       * compras) exige persistir o cache com @tanstack/react-query-persist-client
       * sobre AsyncStorage, que ainda não foi adicionado.
       */
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        // 401 e erros de validação não melhoram com repetição.
        if (error?.isAuth || (error?.status >= 400 && error?.status < 500)) return false;
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
    mutations: {
      /**
       * Mutação NÃO é repetida automaticamente. Repetir um create sem reusar o
       * mesmo id duplicaria a linha; o retry é uma decisão da tela, que sabe
       * qual id reenviar.
       */
      retry: false,
    },
  },
});

/**
 * Liga o "refetch ao focar" do React Query ao ciclo de vida do app nativo.
 * No navegador o padrão é o evento de foco da janela, que não existe em RN.
 */
export function startAppStateSync() {
  const subscription = AppState.addEventListener("change", (state) => {
    if (Platform.OS !== "web") {
      focusManager.setFocused(state === "active");
    }
  });
  return () => subscription.remove();
}

export { onlineManager };
