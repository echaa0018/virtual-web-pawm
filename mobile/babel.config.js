module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          unstable_transformProfile: "hermes-stable",
          // Disable reanimated to avoid worklets dependency issue
          lazyImports: true,
        },
      ],
      "nativewind/babel",
    ],
  };
};
