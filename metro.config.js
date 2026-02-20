const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add support for importing .wasm and .db files
config.resolver.assetExts.push("wasm");
config.resolver.assetExts.push("db");

module.exports = withNativeWind(config, { input: "./global.css" });
