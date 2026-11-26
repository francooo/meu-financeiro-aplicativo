import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "../api/endpoints";
import { useMonth } from "../state/MonthContext";
import { currentMonth } from "../lib/format";
import { uid } from "../lib/uid";
import { isActionable } from "./proposal";

/**
 * Estado da conversa com a assistente, compartilhado por todas as abas.
 *
 * O histórico vive só em memória: some ao fechar o app, de propósito. Não há
 * nada nele que precise sobreviver — o que importa (o gasto lançado) já está
 * no servidor.
 *
 * Cada mensagem: { id, role: "user" | "assistant", content, proposal? }.
 * `proposal.clientId` é o id do item a ser criado, gerado AQUI, uma única vez,
 * quando a proposta chega. O cartão de confirmação reusa esse id em todo retry
 * (invariante 4) — gerar no toque de "Confirmar" duplicaria a linha num reenvio.
 */

/** Só as últimas mensagens vão para a API: limita custo e tamanho do prompt. */
const HISTORY_LIMIT = 12;

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const { month } = useMonth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const chat = useMutation({
    mutationFn: (history) =>
      api.assistantChat({
        messages: history
          .slice(-HISTORY_LIMIT)
          .map(({ role, content }) => ({ role, content })),
        month,
        today: currentMonth(),
      }),
    onSuccess: (res) => {
      const proposal = res?.proposal
        ? {
            ...res.proposal,
            missing: res.proposal.missing || [],
            clientId: isActionable(res.proposal) ? uid() : null,
            status: "pending",
          }
        : null;
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: res?.reply || "Não entendi. Pode repetir?",
          proposal,
        },
      ]);
    },
  });

  const transcribe = useMutation({ mutationFn: (uri) => api.assistantTranscribe(uri) });

  const send = useCallback(
    (raw) => {
      const content = String(raw || "").trim();
      if (!content || chat.isPending) return;
      const next = [...messages, { id: uid(), role: "user", content }];
      setMessages(next);
      chat.mutate(next);
    },
    [messages, chat]
  );

  /** Reenvia o mesmo histórico depois de uma falha (a mensagem do usuário já está nele). */
  const retry = useCallback(() => {
    if (chat.isPending || messages.length === 0) return;
    chat.mutate(messages);
  }, [messages, chat]);

  /** Áudio → texto (Whisper na API) → segue o fluxo normal de `send`. */
  const sendAudio = useCallback(
    (uri) => {
      transcribe.mutate(uri, {
        onSuccess: (res) => {
          const text = String(res?.text || "").trim();
          if (text) send(text);
        },
      });
    },
    [transcribe, send]
  );

  /**
   * Marca o desfecho de uma proposta e registra no chat, para que a IA saiba,
   * na próxima mensagem, o que já foi lançado ou descartado.
   */
  const settleProposal = useCallback((messageId, status, note) => {
    setMessages((prev) => [
      ...prev.map((m) =>
        m.id === messageId && m.proposal ? { ...m, proposal: { ...m.proposal, status } } : m
      ),
      ...(note ? [{ id: uid(), role: "assistant", content: note }] : []),
    ]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    chat.reset();
    transcribe.reset();
  }, [chat, transcribe]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      messages,
      send,
      retry,
      sendAudio,
      settleProposal,
      clear,
      thinking: chat.isPending,
      chatError: chat.error,
      transcribing: transcribe.isPending,
      transcribeError: transcribe.error,
      resetTranscribeError: transcribe.reset,
    }),
    [open, messages, send, retry, sendAudio, settleProposal, clear, chat.isPending, chat.error,
      transcribe.isPending, transcribe.error, transcribe.reset]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant precisa estar dentro de <AssistantProvider>.");
  return ctx;
}
