module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@features': './src/features',
            '@services': './src/services',
            '@stores': './src/stores',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@theme': './src/theme',
            '@assets': './assets',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin', // ✅ ENABLED - Advanced 120fps animations
    ],
  };
};

