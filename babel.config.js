module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", {
                jsxImportSource: "nativewind",
                compiler: false // Explicitly disable React Compiler for React 18 compatibility
            }],
            "nativewind/babel",
        ],
        plugins: [
            "react-native-reanimated/plugin",
        ],
    };
};
