// The web version loads the headline font as WOFF2, about a third of the TTF the apps bundle (docs/01 8.27).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("woff2");

module.exports = config;
