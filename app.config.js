/**
 * Configuração do app Expo.
 *
 * O `scheme` é o que permite ao Google devolver o usuário ao aplicativo depois
 * do login (meufinanceiro://). Mudá-lo invalida os redirect URIs cadastrados
 * no Google Cloud.
 */
export default {
  expo: {
    name: "Meu Financeiro",
    // O slug precisa bater com o projeto em expo.dev/accounts/francooo, senão
    // o `eas init` cria um projeto novo em vez de vincular o existente.
    slug: "meu-financeiro-aplicativo",
    owner: "francooo",
    scheme: "meufinanceiro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    backgroundColor: "#F1F4F2",
    newArchEnabled: true,

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#16382C",
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.andrewsfranco.meufinanceiro",
      infoPlist: {
        NSFaceIDUsageDescription:
          "Usar Face ID para desbloquear o aplicativo e proteger seus dados financeiros.",
      },
    },

    android: {
      package: "com.andrewsfranco.meufinanceiro",
      adaptiveIcon: {
        backgroundColor: "#16382C",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
    },

    plugins: [
      // Login nativo com Google. Exige development build — não roda no Expo Go.
      // Quando houver Client ID de iOS, este plugin passa a precisar de
      // { iosUrlScheme: "com.googleusercontent.apps.<id>" }.
      "@react-native-google-signin/google-signin",
      "expo-secure-store",
      [
        "expo-local-authentication",
        {
          faceIDPermission:
            "Usar Face ID para desbloquear o aplicativo e proteger seus dados financeiros.",
        },
      ],
      // Microfone para falar com a assistente. Adicionar este plugin exige um
      // novo development build (permissão nativa RECORD_AUDIO / NSMicrophone).
      [
        "expo-audio",
        {
          microphonePermission:
            "Usar o microfone para você falar com a assistente financeira.",
          recordAudioAndroid: true,
          enableBackgroundPlayback: false,
        },
      ],
    ],

    experiments: {
      typedRoutes: false,
    },

    // Vincula ao projeto @francooo/meu-financeiro-aplicativo no EAS.
    // Preenchido à mão porque o `eas init` não escreve em config dinâmica
    // (app.config.js), apenas em app.json estático.
    extra: {
      eas: {
        projectId: "eef46586-916d-428d-8c7c-567ac2c41e98",
      },
    },
  },
};
