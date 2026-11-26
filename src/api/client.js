/**
 * Cliente HTTP da API.
 *
 * Contraste deliberado com o `store` do web (_reference/meu-caixa.jsx, 132-249):
 * lá, cada um dos 11 métodos capturava o erro e devolvia vazio em silêncio, e a
 * UI exibia "Salvo" mesmo quando a gravação falhava. No web isso era tolerável
 * porque o autosave seguinte reenviava a coleção inteira e curava sozinho.
 *
 * Com escrita granular esse auto-cura NÃO existe: um POST que falhou significa
 * um item que só existe na memória do app e some no próximo reload. Por isso
 * aqui NADA é engolido — todo erro vira ApiError e sobe para quem chamou.
 */

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, path = "", body = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.body = body;
  }

  /** Sessão inválida ou expirada — o app deve voltar para o login. */
  get isAuth() {
    return this.status === 401;
  }

  /** Sem resposta do servidor: sem rede, DNS, timeout. */
  get isOffline() {
    return this.status === 0;
  }

  /** Erro do servidor, não do pedido — faz sentido oferecer "tentar de novo". */
  get isServer() {
    return this.status >= 500;
  }
}

/* ---------- configuração ---------- */

const baseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError(
      "EXPO_PUBLIC_API_URL não configurada. Defina a URL da API no arquivo .env e reinicie o servidor de desenvolvimento.",
      { status: 0 }
    );
  }
  return url.replace(/\/+$/, "");
};

/**
 * O token vive no AuthContext (que o lê do expo-secure-store). O cliente só
 * recebe um getter, para não duplicar o estado de sessão em dois lugares.
 */
let getToken = () => null;
let onUnauthorized = () => {};

export function configureClient({ tokenGetter, unauthorizedHandler }) {
  if (tokenGetter) getToken = tokenGetter;
  if (unauthorizedHandler) onUnauthorized = unauthorizedHandler;
}

/* ---------- núcleo ---------- */

async function parseBody(res, path) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    /**
     * A API ainda devolve HTML ("Cannot GET /api/x") para rota inexistente,
     * porque o 404 em JSON só entra na Fase A. Sem esta guarda o app quebraria
     * com um erro de parse que não diz nada sobre a causa real — e no celular
     * não há DevTools para investigar.
     */
    const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new ApiError(
      res.status === 404
        ? `Rota não encontrada na API: ${path}`
        : `A API respondeu algo que não é JSON (HTTP ${res.status}).`,
      { status: res.status, path, body: snippet }
    );
  }
}

async function request(path, { method = "GET", body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  /**
   * FormData (upload de áudio do assistente) vai como está e SEM Content-Type
   * explícito: o fetch do React Native precisa gerar o boundary do multipart
   * sozinho. Forçar "multipart/form-data" sem boundary quebra o parse no servidor.
   */
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  let res;
  try {
    const token = getToken();
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body && !isForm ? { "Content-Type": "application/json" } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const offline = err?.name === "AbortError";
    throw new ApiError(
      offline
        ? "O servidor demorou demais para responder. Verifique sua conexão."
        : "Não foi possível falar com o servidor. Verifique sua conexão.",
      { status: 0, path }
    );
  } finally {
    clearTimeout(timer);
  }

  const payload = await parseBody(res, path);

  if (res.status === 401) {
    onUnauthorized();
    throw new ApiError(payload?.error || "Sessão expirada. Entre novamente.", {
      status: 401,
      path,
      body: payload,
    });
  }

  if (!res.ok) {
    throw new ApiError(payload?.error || `Falha na requisição (HTTP ${res.status}).`, {
      status: res.status,
      path,
      body: payload,
    });
  }

  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

/** Monta query string ignorando valores nulos. */
export const qs = (params) => {
  const entries = Object.entries(params || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`;
};
