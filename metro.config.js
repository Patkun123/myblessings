const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Drizzle migrations are imported as .sql modules via babel-plugin-inline-import
config.resolver.sourceExts.push('sql');

// expo-sqlite ships its web build as WebAssembly.
config.resolver.assetExts.push('wasm');

/**
 * expo-sqlite runs SQLite in a Web Worker on web, and Drizzle's Expo driver is
 * synchronous (`prepareSync`/`executeSync`). Results come back through a
 * SharedArrayBuffer, which browsers only expose to cross-origin-isolated pages —
 * hence COOP + COEP. Native builds ignore all of this.
 *
 * Docs: https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
 */
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

nativeWindConfig.server = {
  ...nativeWindConfig.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  },
};

/**
 * `enhanceMiddleware` above is appended to the dev server's middleware stack, but
 * the Expo CLI serves the root document (`GET /`) from its manifest middleware,
 * which is mounted *first*. So `/` never sees the headers, `crossOriginIsolated`
 * is false, `SharedArrayBuffer` is undefined, and every SQLite call fails with
 * "SharedArrayBuffer is not defined" — on first load only, which makes it look
 * like flaky local state.
 *
 * Setting the headers when the response is flushed covers every dev-server
 * response regardless of which middleware produced it. Dev server only: this
 * file is not part of the bundle. A static deploy needs the same two headers in
 * the host configuration.
 */
const http = require('node:http');
const PATCHED = Symbol.for('myblessings.crossOriginIsolation');

if (!http.ServerResponse.prototype[PATCHED]) {
  const originalWriteHead = http.ServerResponse.prototype.writeHead;

  http.ServerResponse.prototype.writeHead = function writeHeadWithIsolation(...args) {
    if (!this.headersSent) {
      if (!this.hasHeader('Cross-Origin-Opener-Policy')) {
        this.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      }
      if (!this.hasHeader('Cross-Origin-Embedder-Policy')) {
        this.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      }
    }
    return originalWriteHead.apply(this, args);
  };

  http.ServerResponse.prototype[PATCHED] = true;
}

module.exports = nativeWindConfig;
