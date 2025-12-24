module.exports = {
  dependencies: {
    '@react-native-mapbox-gl/maps': {
      platforms: {
        ios: null, // disable iOS platform, Android will still autolink
        android: {
          sourceDir: '../node_modules/@react-native-mapbox-gl/maps/android',
          packageImportPath: 'import com.mapbox.rctmgl.RCTMGLPackage;',
        },
      },
    },
  },
};