import * as Crypto from "expo-crypto";

/**
 * Gera o id de um item novo, no CLIENTE.
 *
 * Não é detalhe de implementação: o id do cliente é o que torna o create
 * idempotente na API (INSERT ... ON CONFLICT DO NOTHING). Quem repetir um
 * envio que falhou precisa REUSAR o mesmo id — chamar uid() de novo no retry
 * anula a proteção e duplica a linha.
 */
export const uid = () => Crypto.randomUUID();
