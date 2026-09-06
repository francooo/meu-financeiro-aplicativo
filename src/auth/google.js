import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

/**
 * Login com Google, devolvendo o ID token que a API espera.
 *
 * POR QUE A BIBLIOTECA NATIVA E NÃO O expo-auth-session:
 *
 * O atalho `expo-auth-session/providers/google` foi descontinuado no SDK 57, e
 * a API genérica esbarra no redirect URI: o cliente OAuth do tipo Android
 * espera o esquema derivado do pacote (com.andrewsfranco.meufinanceiro:/...),
 * enquanto o makeRedirectUri gera um esquema customizado (meufinanceiro://).
 *
 * Esta biblioteca usa o fluxo nativo do Android, que não passa por redirect
 * URI nenhum — o sistema operacional entrega o token direto ao app. É o
 * caminho que o Expo recomenda hoje.
 *
 * PAPEL DE CADA CLIENT ID:
 *   webClientId  → define a AUDIÊNCIA do idToken. É este que o servidor valida
 *                  em verifyIdToken. Obrigatório para receber um idToken.
 *   Android      → não aparece no código. O Google usa o par
 *                  (pacote + SHA-1) para autorizar o app a pedir o token.
 *   iosClientId  → equivalente do Android no iOS.
 *
 * EXIGE DEVELOPMENT BUILD — não funciona no Expo Go, porque depende de código
 * nativo. Use o Expo Go para conferir layout e navegação; o login só fecha no
 * build.
 */

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;

export function useGoogleAuth() {
  const [configured, setConfigured] = useState(false);

  const configError = useMemo(() => {
    if (!WEB_CLIENT_ID) {
      return "Login não configurado: defina EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB no arquivo .env e reinicie o servidor.";
    }
    return null;
  }, []);

  useEffect(() => {
    if (configError) return;
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : null),
      scopes: ["openid", "profile", "email"],
    });
    setConfigured(true);
  }, [configError]);

  /**
   * Abre o seletor de conta do Google.
   * @returns {Promise<string|null>} o idToken, ou null se o usuário desistiu.
   * @throws  Error com mensagem legível em caso de falha real.
   */
  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === "android") {
      // Sem os serviços do Google Play o fluxo nativo não existe. Falhar aqui,
      // com mensagem clara, é melhor que um erro genérico depois.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    let res;
    try {
      res = await GoogleSignin.signIn();
    } catch (err) {
      throw new Error(describeError(err));
    }

    if (res?.type === "cancelled") return null;

    const idToken = res?.data?.idToken ?? null;
    if (!idToken) {
      throw new Error(
        "O Google não devolveu um token de identidade. Verifique se o EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB é do tipo Web."
      );
    }
    return idToken;
  }, []);

  /** Encerra a sessão no lado do Google, para o próximo login pedir a conta. */
  const signOutGoogle = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Sair do app não pode depender de o Google responder.
    }
  }, []);

  return {
    ready: configured && !configError,
    configError,
    signInWithGoogle,
    signOutGoogle,
  };
}

/** Traduz os códigos da biblioteca para algo acionável na tela. */
function describeError(err) {
  switch (err?.code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return "Login cancelado.";
    case statusCodes.IN_PROGRESS:
      return "Já existe um login em andamento.";
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return "Os serviços do Google Play não estão disponíveis neste aparelho.";
    case "DEVELOPER_ERROR":
      /**
       * O erro mais comum e o mais opaco. No Android significa que o par
       * (nome do pacote + SHA-1) enviado não bate com nenhum cliente OAuth
       * cadastrado no Google Cloud.
       */
      return (
        "Configuração do Google não confere. Verifique se o cliente OAuth do tipo Android " +
        "usa o pacote com.andrewsfranco.meufinanceiro e o SHA-1 do keystore deste build " +
        "(eas credentials)."
      );
    default:
      return err?.message || "Falha ao entrar com o Google.";
  }
}
