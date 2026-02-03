export default {
  expo: {
    name: "Tarpup",
    slug: "Tarpup",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/images/tarpup-lightt.png",
    scheme: "rnfrontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    backgroundColor: "#0a0a0a",

    ios: {
      supportsTablet: true,
      backgroundColor: "#0a0a0a",
      bundleIdentifier: "com.Tarpup.app",
      buildNumber: "50",

      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,

        // ✅ REQUIRED FOR LOCATION PERMISSIONS (FIXED)
        NSLocationWhenInUseUsageDescription:
          "Tarpup needs your location to add photo markers on the map.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Tarpup uses your location to display accurate map markers.",
        UIBackgroundModes: [
          "remote-notification",
          "fetch"
        ]
      },

      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
      entitlements: {
        "aps-environment": "production"
      }
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/tarpup-lightt.png"
      },
      backgroundColor: "#0a0a0a",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.Tarpup.app",
      googleServicesFile: "./google-services.json"
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",

      [
        "expo-splash-screen",
        {
          image: "./assets/images/tarpup-lightt.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0a0a0a",
          dark: {
            image: "./assets/images/tarpup-darkk.png",
            backgroundColor: "#0a0a0a"
          }
        }
      ],

      [
        "expo-font",
        {
          fonts: [
            "./assets/fonts/Geist-Regular.ttf",
            "./assets/fonts/Geist-Medium.ttf",
            "./assets/fonts/Geist-SemiBold.ttf",
            "./assets/fonts/Geist-Bold.ttf",
            "./assets/fonts/GeistMono-Regular.ttf",
            "./assets/fonts/GeistMono-Medium.ttf",
            "./assets/fonts/GeistMono-SemiBold.ttf"
          ]
        }
      ],

      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp", "RNFBMessaging"]
          }
        }
      ],

      "expo-notifications",
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsImpl": "mapbox"
        }
      ]
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    extra: {
      router: {},
      "eas": {
        "projectId": "9386a1c9-eed3-4a02-8943-efcecb53cc62"
      },
      MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN
    },

    runtimeVersion: "1.0.2",

    owner: "expo_travor"
  }
};






// export default {
//   expo: {
//     name: "Tarpup",
//     slug: "Tarpup",
//     version: "1.0.0",
//     orientation: "portrait",
//     icon: "./assets/images/tarpup-light.png",
//     scheme: "rnfrontend",
//     userInterfaceStyle: "automatic",
//     newArchEnabled: true,
//     backgroundColor: "#0a0a0a",
//     ios: {
//       supportsTablet: true,
//       backgroundColor: "#0a0a0a",
//       bundleIdentifier: "com.Tarpup.app",
//       buildNumber: "17",
//       infoPlist: {
//         ITSAppUsesNonExemptEncryption: false
//       },
//       googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist',
//       entitlements: {
//         "aps-environment": "production"
//       }
//     },
//     android: {
//       adaptiveIcon: {
//         backgroundColor: "#0a0a0a",
//         foregroundImage: "./assets/images/tarpup-light.png",
//         backgroundImage: "./assets/images/tarpup-light.png",
//         monochromeImage: "./assets/images/tarpup-light.png"
//       },
//       backgroundColor: "#0a0a0a",
//       edgeToEdgeEnabled: true,
//       predictiveBackGestureEnabled: false,
//       package: "com.vector10.Tarpup",
//       googleServicesFile: "./google-services.json"
//     },
//     web: {
//       output: "static",
//       favicon: "./assets/images/favicon.png"
//     },
//     plugins: [
//       "expo-router",
//       [
//         "expo-splash-screen",
//         {
//           image: "./assets/images/tarpup-light.png",
//           imageWidth: 200,
//           resizeMode: "contain",
//           backgroundColor: "#0a0a0a",
//           dark: {
//             image: "./assets/images/tarpup-dark.png",
//             backgroundColor: "#0a0a0a"
//           }
//         }
//       ],
//       [
//         "expo-font",
//         {
//           fonts: [
//             "./assets/fonts/Geist-Regular.ttf",
//             "./assets/fonts/Geist-Medium.ttf",
//             "./assets/fonts/Geist-SemiBold.ttf",
//             "./assets/fonts/Geist-Bold.ttf",
//             "./assets/fonts/GeistMono-Regular.ttf",
//             "./assets/fonts/GeistMono-Medium.ttf",
//             "./assets/fonts/GeistMono-SemiBold.ttf"
//           ]
//         }
//       ],
//       "expo-build-properties",
//       "expo-notifications"
//     ],
//     experiments: {
//       typedRoutes: true,
//       reactCompiler: true
//     },
//     extra: {
//       router: {},
//       eas: {
//         projectId: "b8094831-e558-419d-b061-cacb75387f83"
//       }
//     },
//     runtimeVersion: {
//       policy: "appVersion"
//     },
//     owner: "blaise-10"
//   }
// }
