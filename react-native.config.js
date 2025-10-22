module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {
    // Disable auto-linking for react-native-maps on iOS
    // We manually configure it to use Google Maps in Podfile
    'react-native-maps': {
      platforms: {
        ios: null,
      },
    },
  },
};
