import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { configureClient } from "../api/client";
import * as endpoints from "../api/endpoints";
import { clearSession, loadSession, saveSession } from "./session";

/**
 * Estado de sessão do app.
 *
 * Duas responsabilidades que o web não tinha:
 *
 * 1. O token vive em armazenamento seguro e é injetado no cliente HTTP por um
 *    getter via ref, evitando closure obsoleta em requisição concorrente.
 *
 * 2. 401 em QUALQUER requisição derruba a sessão e volta ao login. No web isso
 *    não existia: os `store.*` engoliam o 401 e o app seguia exibindo tela
 *    cheia com dados que não estavam mais sendo salvos.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading"); // loading | signedOut | signedIn
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);

  // Ref para o getter do cliente HTTP ler sempre o valor atual.
  const tokenRef = useRef(null);

  const signOutLocal = useCallback(async () => {
    tokenRef.current = null;
    setEmail(null);
    await clearSession();
    setStatus("signedOut");
  }, []);

  // Registrado uma vez: o cliente HTTP não deve conhecer o React.
  useEffect(() => {
    configureClient({
      tokenGetter: () => tokenRef.current,
      unauthorizedHandler: () => {
        signOutLocal();
      },
    });
  }, [signOutLocal]);

  /**
   * Boot: restaura o token salvo e CONFIRMA com o servidor.
   *
   * A confirmação não é opcional. No iOS o keychain sobrevive à desinstalação,
   * então um token antigo pode reaparecer numa reinstalação; e o servidor pode
   * ter revogado a sessão (troca de SESSION_SECRET ou de ALLOWED_EMAIL).
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await loadSession();
        if (!saved) {
          if (!cancelled) setStatus("signedOut");
          return;
        }

        tokenRef.current = saved.token;
        const res = await endpoints.me();

        if (cancelled) return;
        setEmail(res?.email ?? saved.email ?? null);
        setStatus("signedIn");
      } catch (err) {
        if (cancelled) return;
        /**
         * Só descarta o token se o servidor RECUSOU (401). Falha de rede não
         * pode deslogar: no celular, abrir o app no elevador derrubaria a
         * sessão a cada vez.
         */
        if (err?.isAuth) {
          await clearSession();
          tokenRef.current = null;
          setStatus("signedOut");
        } else {
          setEmail(null);
          setStatus("signedIn");
          setError(err?.message ?? null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Troca o ID token do Google por uma sessão da API. */
  const signIn = useCallback(async (idToken) => {
    setError(null);
    const res = await endpoints.loginWithGoogle(idToken);

    if (!res?.token) {
      /**
       * A API só devolve o token no corpo quando reconhece client:"mobile".
       * Se isso não veio, o backend ainda não recebeu o trabalho da Fase A.
       */
      throw new Error(
        "A API não devolveu um token de sessão. O suporte a Bearer para mobile ainda não foi publicado no backend."
      );
    }

    tokenRef.current = res.token;
    await saveSession({ token: res.token, email: res.email });
    setEmail(res.email ?? null);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await endpoints.logout();
    } catch {
      // Logout é local por definição: o JWT é stateless e não há blocklist.
      // Falhar em avisar o servidor não pode impedir o usuário de sair.
    }
    try {
      // Sem isto o Google reentra sozinho com a última conta, e trocar de
      // conta passa a ser impossível pela interface do app.
      await GoogleSignin.signOut();
    } catch {
      // idem: sair não pode depender de o Google responder.
    }
    await signOutLocal();
  }, [signOutLocal]);

  return (
    <AuthContext.Provider
      value={{ status, email, error, signIn, signOut, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
