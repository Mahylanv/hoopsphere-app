<<<<<<< HEAD
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

=======
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
>>>>>>> origin/feature/club-bdd
module.exports = withNativeWind(config, { input: './global.css' })