const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

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
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        console.log(`[Metro] ${req.method} ${req.url}`);
        return middleware(req, res, next);
      };
    },
  },
  resetCache: true,
  watchFolders: [path.resolve(__dirname)],
  resolver: {
    blockList: [
      // Exclude iOS build artifacts and project files
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,
      /ios\/JewgoAppFinal\/.*/,
      /ios\/.*\.xcodeproj\/.*/,
      /ios\/.*\.xcworkspace\/.*/,
      // Exclude Android build artifacts
      /android\/build\/.*/,
      /android\/app\/build\/.*/,
      // Exclude other build artifacts
      /\.buckd\/.*/,
      /\.gradle\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
