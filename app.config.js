
export default {
  expo: {
    name: "Tarpup",
    slug: "Tarpup",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/tarpup-light.png",
    scheme: "rnfrontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    backgroundColor: "#0a0a0a",
    ios: {
      supportsTablet: true,
      backgroundColor: "#0a0a0a",
      bundleIdentifier: "com.Tarpup.app",
      buildNumber: "17",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist',
      entitlements: {
        "aps-environment": "production"
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0a0a0a",
        foregroundImage: "./assets/images/tarpup-light.png",
        backgroundImage: "./assets/images/tarpup-light.png",
        monochromeImage: "./assets/images/tarpup-light.png"
      },
      backgroundColor: "#0a0a0a",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.vector10.Tarpup",
      googleServicesFile: "./google-services.json"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/tarpup-light.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0a0a0a",
          dark: {
            image: "./assets/images/tarpup-dark.png",
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
      // CHANGED: Added iOS configuration to expo-build-properties
      [
        "expo-build-properties",
        {
          ios: {
            // Tells iOS to use static frameworks instead of dynamic frameworks
            // This is required for Firebase SDK compatibility
            useFrameworks: "static",
            
            // Specifies extra CocoaPods to install with custom configuration
            // These modular_headers enable Swift pods to work with static libraries
            extraPods: [
              {
                // GoogleUtilities is a dependency of Firebase that needs module maps
                name: "GoogleUtilities",
                modular_headers: true
              },
              {
                // FirebaseCoreInternal is a Swift pod that requires module maps
                name: "FirebaseCoreInternal",
                modular_headers: true
              },
              {
                // FirebaseCore is the base Firebase pod
                name: "FirebaseCore",
                modular_headers: true
              }
            ]
          }
        }
      ],
      "expo-notifications"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "b8094831-e558-419d-b061-cacb75387f83"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    owner: "blaise-10"
  }
}







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
