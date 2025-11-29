const IS_PROD = process.env.APP_ENV === "production";

export default {
  expo: {
    name: "RivalPicks",
    slug: "rivalpicks",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rivalpicks",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      usesAppleSignIn: true,
      infoPlist: {
        NSAppTransportSecurity: IS_PROD
          ? {
              // Production: Block all HTTP
              NSAllowsArbitraryLoads: false,
            }
          : {
              // Development: Allow HTTP for local testing
              NSAllowsArbitraryLoads: true,
            },
        NSPhotoLibraryUsageDescription:
          "This app needs access to your photo library to let you choose a profile picture.",
        NSCameraUsageDescription:
          "This app needs access to your camera to let you take a profile picture.",
        UIBackgroundModes: ["remote-notification"],
      },
      bundleIdentifier: "com.rivalpicks.app",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      // Production: Block HTTP, Development: Allow HTTP
      usesCleartextTraffic: !IS_PROD,
      package: "com.rivalpicks.app",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA",
      ],
      googleServicesFile: "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "./plugins/withFirebaseModularHeaders",
      "@react-native-google-signin/google-signin",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 150,
          resizeMode: "contain",
          backgroundColor: "#0a0a0f",
        },
      ],
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#4F46E5",
          defaultChannel: "default",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
