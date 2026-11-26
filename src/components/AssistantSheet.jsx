import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { Icon } from "./Icon";
import { ErrorState } from "./ui";
import { ProposalCard } from "./ProposalCard";
import { useAssistant } from "../assistant/AssistantContext";
import { colors, font, radius, spacing, TOUCH_TARGET } from "../lib/theme";

const SUGGESTIONS = [
  "Crie um gasto de R$ 50 no mercado, descontar do CLT",
  "Recebi R$ 300 de freela",
  "Adiciona leite na lista do mercado",
  "Quanto sobrou do CLT este mês?",
];

/**
 * Folha do chat com a assistente (texto e voz).
 *
 * Voz: grava em m4a (expo-audio, preset LOW_QUALITY), a API transcreve com o
 * Whisper da Groq e o texto entra como mensagem do usuário — daí em diante é o
 * mesmo fluxo do texto. Exige development build com o plugin "expo-audio".
 */
export default function AssistantSheet() {
  const {
    open,
    setOpen,
    messages,
    send,
    retry,
    sendAudio,
    clear,
    thinking,
    chatError,
    transcribing,
    transcribeError,
    resetTranscribeError,
  } = useAssistant();

  const [draft, setDraft] = useState("");
  const [micError, setMicError] = useState(null);
  const scrollRef = useRef(null);

  // LOW_QUALITY (64 kbps) basta para fala e mantém o upload bem abaixo do
  // limite de 4,5 MB de corpo das funções da Vercel.
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const recording = Boolean(recorderState.isRecording);

  const busy = thinking || transcribing;

  // Fechar a folha no meio de uma gravação não pode deixar o microfone aberto.
  useEffect(() => {
    if (open || !recording) return;
    recorder
      .stop()
      .then(() => setAudioModeAsync({ allowsRecording: false }))
      .catch((err) => setMicError(err));
  }, [open, recording, recorder]);

  const submit = () => {
    if (!draft.trim() || busy) return;
    send(draft);
    setDraft("");
  };

  const toggleMic = async () => {
    setMicError(null);
    resetTranscribeError();
    try {
      if (recording) {
        await recorder.stop();
        // Sem desligar o modo de gravação, o iOS manda o áudio para o alto-falante de ligação.
        await setAudioModeAsync({ allowsRecording: false });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (recorder.uri) sendAudio(recorder.uri);
        else setMicError(new Error("A gravação não gerou arquivo. Tente de novo."));
        return;
      }

      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setMicError(
          new Error("Permissão de microfone negada. Libere nas configurações do aparelho.")
        );
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      // Não é engolido: aparece no ErrorState logo acima do campo de texto.
      setMicError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const seconds = Math.floor((recorderState.durationMillis || 0) / 1000);

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setOpen(false)}
    >
      <SafeAreaView style={st.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={st.flex} behavior="padding">
          {/* cabeçalho */}
          <View style={st.header}>
            <View style={st.headerTitle}>
              <View style={st.avatar}>
                <Icon name="Sparkles" size={16} color={colors.textOnPrimary} />
              </View>
              <Text style={st.title}>Assistente</Text>
            </View>
            {messages.length > 0 ? (
              <Pressable
                onPress={clear}
                accessibilityRole="button"
                accessibilityLabel="Limpar conversa"
                style={({ pressed }) => [st.iconBtn, pressed && st.pressed]}
              >
                <Icon name="Trash2" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar assistente"
              style={({ pressed }) => [st.iconBtn, pressed && st.pressed]}
            >
              <Icon name="X" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* conversa */}
          <ScrollView
            ref={scrollRef}
            style={st.flex}
            contentContainerStyle={st.list}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={st.intro}>
                <Text style={st.introText}>
                  Peça por texto ou pelo microfone. Se faltar alguma informação, eu pergunto.
                  Nada é salvo sem a sua confirmação.
                </Text>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => send(s)}
                    accessibilityRole="button"
                    style={({ pressed }) => [st.suggestion, pressed && st.pressed]}
                  >
                    <Text style={st.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {messages.map((m) => (
              <View
                key={m.id}
                style={[st.bubbleRow, m.role === "user" ? st.rowUser : st.rowBot]}
              >
                <View style={[st.bubble, m.role === "user" ? st.bubbleUser : st.bubbleBot]}>
                  <Text style={m.role === "user" ? st.textUser : st.textBot}>{m.content}</Text>
                  {m.proposal?.clientId ? <ProposalCard message={m} /> : null}
                </View>
              </View>
            ))}

            {busy ? (
              <View style={[st.bubbleRow, st.rowBot]}>
                <View style={[st.bubble, st.bubbleBot, st.thinking]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={st.textMuted}>
                    {transcribing ? "Transcrevendo áudio…" : "Pensando…"}
                  </Text>
                </View>
              </View>
            ) : null}

            <ErrorState error={chatError} compact onRetry={retry} />
          </ScrollView>

          <View style={st.errors}>
            <ErrorState error={transcribeError} compact />
            <ErrorState error={micError} compact />
          </View>

          {/* entrada */}
          <View style={st.inputRow}>
            {recording ? (
              <View style={st.recording}>
                <View style={st.dot} />
                <Text style={st.recordingText}>
                  Gravando… {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                </Text>
              </View>
            ) : (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Peça algo à assistente"
                placeholderTextColor={colors.textSubtle}
                style={st.input}
                multiline
                editable={!busy}
                onSubmitEditing={submit}
                submitBehavior="submit"
                returnKeyType="send"
              />
            )}

            {draft.trim() && !recording ? (
              <Pressable
                onPress={submit}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                style={({ pressed }) => [st.roundBtn, busy && st.disabled, pressed && st.pressed]}
              >
                <Icon name="Send" size={18} color={colors.textOnPrimary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={toggleMic}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={recording ? "Parar e enviar áudio" : "Falar com a assistente"}
                style={({ pressed }) => [
                  st.roundBtn,
                  recording && st.roundBtnRecording,
                  busy && st.disabled,
                  pressed && st.pressed,
                ]}
              >
                <Icon
                  name={recording ? "Square" : "Mic"}
                  size={18}
                  color={colors.textOnPrimary}
                />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  headerTitle: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  iconBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },

  list: { padding: spacing.lg, gap: spacing.sm },

  intro: { gap: spacing.sm },
  introText: { fontSize: font.sm, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.xs },
  suggestion: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
  suggestionText: { fontSize: font.sm, color: colors.text },

  bubbleRow: { flexDirection: "row" },
  rowUser: { justifyContent: "flex-end" },
  rowBot: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "88%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm / 2 },
  bubbleBot: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm / 2,
  },
  textUser: { fontSize: font.md, color: colors.textOnPrimary, lineHeight: 21 },
  textBot: { fontSize: font.md, color: colors.text, lineHeight: 21 },
  textMuted: { fontSize: font.sm, color: colors.textMuted },
  thinking: { flexDirection: "row", alignItems: "center", gap: spacing.sm },

  errors: { paddingHorizontal: spacing.lg, gap: spacing.sm },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: font.md,
    color: colors.text,
  },
  recording: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  recordingText: { fontSize: font.md, color: colors.text },
  roundBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnRecording: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
