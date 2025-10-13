const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8081,
    // Enable verbose logging for debugging
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        console.log(`[Metro] ${req.method} ${req.url}`);
        return middleware(req, res, next);
      };
    },
  },
  resetCache: true,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
