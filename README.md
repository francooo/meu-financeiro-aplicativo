# Meu Financeiro — Aplicativo Mobile

Interface mobile do sistema Meu Financeiro, em React Native + Expo.

Este repositório contém **apenas o aplicativo**. O front web e a API vivem no
repositório do web e são publicados na Vercel. As duas interfaces consomem a
mesma API e o mesmo banco — não há base de dados separada para o mobile.

```
Web + Mobile → API/Backend → Banco de Dados
```

O aplicativo **nunca acessa o banco diretamente**. Toda comunicação passa por
HTTPS até a API, que centraliza autenticação, autorização, validação, regras de
negócio e acesso a dados.

---

## Como rodar

```bash
npm install
cp .env.example .env    # preencha os valores
npx expo start
```

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Para que serve |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL da API na Vercel, sem barra no final |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | fallback quando não há ID da plataforma |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | usado no development build Android |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | usado no development build iOS |

> **Nunca** coloque `DATABASE_URL`, `SESSION_SECRET` ou `ALLOWED_EMAIL` aqui.
> Tudo com prefixo `EXPO_PUBLIC_` é embutido no binário e legível por quem abrir
> o APK. Esses três são segredos do servidor e vivem apenas nas variáveis de
> ambiente do projeto da Vercel.

### Login com Google

A tela de login exibe, em desenvolvimento, o **redirect URI** que precisa ser
cadastrado no Google Cloud Console. Não adivinhe esse valor — copie da tela.
Redirect URI errado é a causa mais comum de login que não retorna ao app.

---

## Builds

O deploy do mobile é independente do deploy do web.

```
Código-fonte → Expo/React Native → EAS Build → APK/AAB (Android) · IPA (iOS)
```

| Perfil | Uso | Comando |
|---|---|---|
| `development` | desenvolvimento no dispositivo, com dev client | `eas build --profile development` |
| `preview` | distribuição interna (a usada hoje) | `eas build --profile preview` |
| `production` | build de loja | `eas build --profile production` |

**O login Google exige development build.** Ele usa
`@react-native-google-signin/google-signin`, que depende de código nativo e não
roda no Expo Go. Use o Expo Go para conferir layout, navegação e alvos de toque;
use o development build para exercitar o login.

Client IDs de Android e iOS se criam no Google Cloud Console
(https://console.cloud.google.com/apis/credentials), com o pacote
`com.andrewsfranco.meufinanceiro`. O SHA-1 do Android sai de `eas credentials`.

Papel de cada Client ID: o **Web** define a audiência do `idToken` e é o único
citado no código (`webClientId`); o **Android** não aparece em lugar nenhum — o
Google o usa para autorizar o app pelo par pacote + SHA-1.

---

## Estrutura

```
src/
├── api/
│   ├── client.js        cliente HTTP: Bearer, timeout, 401 central
│   ├── endpoints.js     contrato da API em um lugar só
│   ├── hooks.js         React Query: leituras e mutações
│   └── queryClient.js   cache, refetch ao focar
├── auth/
│   ├── AuthContext.jsx  estado de sessão
│   ├── google.js        login Google (ID token)
│   └── session.js       token no keychain/Keystore
├── lib/
│   ├── domain.js        categorias, formas de pagamento (dados puros)
│   ├── format.js        moeda, datas, meses
│   ├── calc.js          totais, carteiras, agrupamentos
│   ├── theme.js         tokens de cor, espaçamento, tipografia
│   └── uid.js           id do cliente (idempotência)
├── components/          Icon, Row, Section, ScreenShell, ui
├── screens/             5 telas
├── navigation/          abas inferiores
└── state/               mês selecionado
```

### Duas decisões que valem conhecer

**Nenhum erro é engolido.** No web, os métodos de rede capturavam a falha em
silêncio e a interface exibia "Salvo" de qualquer forma. Aquilo era tolerável
porque a persistência era por substituição total: o autosave seguinte reenviava
a coleção inteira e curava sozinho. Com escrita por item esse auto-cura não
existe — uma falha não mostrada é um dado perdido. Por isso `src/api/client.js`
propaga tudo e as telas exibem `ErrorState`.

**O id é gerado no cliente.** `src/lib/uid.js` cria o id antes de enviar, e a
API usa `ON CONFLICT DO NOTHING`. Isso torna o create idempotente: reenviar
depois de uma resposta perdida devolve a linha existente em vez de duplicar. O
modo de falha real no celular não é edição simultânea — é "a requisição chegou,
a resposta se perdeu, o usuário tocou de novo". **Ao repetir um envio, reuse o
mesmo id.**

---

## Estado da integração

As leituras funcionam contra a API atual. As **escritas granulares**
(`POST`/`PATCH`/`DELETE` por item) dependem do trabalho de backend descrito no
plano, feito no repositório do web. Até lá elas respondem 404, e o app mostra
uma mensagem clara em vez de quebrar.

Os pontos que dependem disso estão marcados com `[FASE A]` em
`src/api/endpoints.js`.

### Pronto

As 5 abas leem e exibem os dados reais, com busca, agrupamento por categoria,
seletor de mês, pull-to-refresh, alvos de toque de 44pt e estados de erro
visíveis. O fluxo de sessão está implementado ponta a ponta — login, guarda no
keychain, validação no boot, 401 global e logout.

**Ainda não é possível entrar**, por dois motivos independentes: o login exige
development build (ver acima) e a API ainda não devolve o token no corpo da
resposta, o que depende da Fase A. Marcar item como pago/comprado já usa mutação
granular, e também só persiste depois da Fase A.

### Falta

| Item | Observação |
|---|---|
| Formulário de lançamento | ainda não há como criar ou editar gasto/ganho pelo app |
| FAB de lançamento rápido | a ação mais frequente no celular |
| Swipe para pagar/excluir | `react-native-gesture-handler` já instalado |
| Arrastar para reordenar | substitui as setas ↑↓ do web |
| Calculadora de seleção | `selectionStats` já portado em `src/lib/calc.js` |
| Bloqueio por biometria | `expo-local-authentication` já instalado |
| Leitura offline entre sessões | exige persistir o cache do React Query |
| Mover gasto de mês | endpoint já existe na API |

---

## `_reference/`

Contém o código do app web, mantido como especificação funcional durante a
portabilidade. Não é compilado, está no `.gitignore` e deve ser removido quando
as telas estiverem completas.
