const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Drizzle migrations are imported as .sql modules via babel-plugin-inline-import
config.resolver.sourceExts.push('sql');

// expo-sqlite ships its web build as WebAssembly.
config.resolver.assetExts.push('wasm');

const nativeWindConfig = withNativeWind(config, { input: './global.css' });

/**
 * expo-sqlite runs SQLite in a Web Worker on web, and Drizzle's Expo driver
 * only has a synchronous API. Sync calls hand results back through a
 * SharedArrayBuffer, which browsers expose only to cross-origin-isolated
 * pages — hence COOP + COEP. Native builds ignore all of this.
 */
nativeWindConfig.server = {
  ...nativeWindConfig.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  },
};

module.exports = nativeWindConfig;
