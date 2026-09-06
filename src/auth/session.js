import * as SecureStore from "expo-secure-store";

/**
 * Persistência da sessão no keychain (iOS) / Keystore (Android).
 *
 * Não usar AsyncStorage: ali o JWT ficaria em texto claro, legível por qualquer
 * processo com acesso ao sandbox do app em aparelho comprometido.
 *
 * Nota de plataforma: no iOS o keychain SOBREVIVE à desinstalação do app. Um
 * token antigo pode reaparecer numa reinstalação — por isso o boot sempre
 * valida a sessão contra GET /api/auth/me em vez de confiar no que está salvo.
 */

const TOKEN_KEY = "session_token";
const EMAIL_KEY = "session_email";

export async function saveSession({ token, email }) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (email) await SecureStore.setItemAsync(EMAIL_KEY, email);
}

export async function loadSession() {
  const [token, email] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(EMAIL_KEY),
  ]);
  return token ? { token, email } : null;
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
  ]);
}
