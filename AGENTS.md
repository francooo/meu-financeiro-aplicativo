# Meu Financeiro — aplicativo mobile

Este repositório é **apenas o app**. O front web e a API vivem no repositório do
web, publicados na Vercel.

## Expo mudou

Leia a documentação da versão exata antes de escrever código:
https://docs.expo.dev/versions/v57.0.0/

Já mordeu duas vezes no login Google: o atalho
`expo-auth-session/providers/google` foi descontinuado no SDK 57, e a API
genérica esbarra no redirect URI (o cliente OAuth Android espera o esquema
derivado do pacote, não um esquema customizado). Hoje usamos
`@react-native-google-signin/google-signin`, que exige development build.
Justificativa completa em `src/auth/google.js`.

## Invariantes do projeto

**1. O app nunca acessa o banco.** Toda leitura e escrita passa pela API. Se
aparecer a necessidade de uma consulta nova, ela vira endpoint — não driver de
banco no cliente.

**2. Nenhum segredo em `EXPO_PUBLIC_*`.** Tudo com esse prefixo é embutido no
binário e legível por quem abrir o APK. `DATABASE_URL`, `SESSION_SECRET` e
`ALLOWED_EMAIL` são do servidor e não entram aqui em hipótese alguma.

**3. Nenhum erro engolido.** `src/api/client.js` propaga tudo; as telas mostram
`ErrorState`. Nunca escreva `catch {}` numa operação de escrita: como a
persistência é por item, uma falha silenciosa é um dado perdido — sem o
auto-cura que a substituição total dava no web.

**4. O id vem do cliente.** `src/lib/uid.js` gera o id antes do envio e a API
usa `ON CONFLICT DO NOTHING`. Ao repetir um envio que falhou, **reuse o mesmo
id** — chamar `uid()` de novo duplica a linha.

**5. Regra de negócio é do servidor.** Recorrência, parcelas e propagação entre
meses são decididas na API. `src/lib/calc.js` só faz cálculo de exibição.

## Estado da integração

A criação de um item (`POST /api/expenses`, `/incomes`, `/wishlist`,
`/shopping`) está marcada `[CRIAR]` em `src/api/endpoints.js` e existe na API a
partir do merge da branch `assistente-web` do repositório do web. As demais
escritas granulares (editar, apagar, reordenar) continuam `[FASE A]` e
respondem 404 até serem publicadas.

A assistente financeira (botão flutuante, `src/assistant/`) depende de
`/api/assistant/chat` e `/api/assistant/transcribe`, marcadas `[FASE B]`. A
chamada à Groq acontece na API, com `GROQ_API_KEY` na Vercel — nunca no app. A
API só **propõe**; o app grava pelas rotas granulares depois da confirmação do
usuário, com o id gerado quando a proposta chega (reusado no retry). A voz usa
`expo-audio` e exige development build.

## `_reference/`

Código do app web, mantido como especificação funcional durante a portabilidade.
Não é compilado (está no `.gitignore` e no `.easignore`) e deve ser removido
quando as telas estiverem completas.
