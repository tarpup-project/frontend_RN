const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// WatermelonDB configuration
config.resolver.alias = {
  ...config.resolver.alias,
  '@nozbe/watermelondb/DatabaseProvider': '@nozbe/watermelondb/DatabaseProvider/index.native.js',
};

// Ensure SQLite is properly resolved
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

module.exports = config;
