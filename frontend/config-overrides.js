module.exports = function override(config) {
    console.log("Applying Webpack config to exclude source-map-loader for node_modules");

    // In cấu hình rules để debug
    console.log("Original Webpack rules:", JSON.stringify(config.module.rules, null, 2));

    // Duyệt qua tất cả các rules
    config.module.rules = config.module.rules.map((rule) => {
        // Kiểm tra rule là object và có use
        if (rule && typeof rule === "object") {
            // Xử lý rule dạng oneOf (dùng trong CRA)
            if (rule.oneOf && Array.isArray(rule.oneOf)) {
                return {
                    ...rule,
                    oneOf: rule.oneOf.map((subRule) => {
                        if (subRule && Array.isArray(subRule.use)) {
                            return {
                                ...subRule,
                                use: subRule.use.map((loader) => {
                                    if (
                                        loader === "source-map-loader" ||
                                        (typeof loader === "object" && loader.loader === "source-map-loader")
                                    ) {
                                        console.log("Found source-map-loader in oneOf, applying exclude");
                                        return {
                                            ...loader,
                                            loader: "source-map-loader",
                                            options: {
                                                ...(typeof loader === "object" ? loader.options : {}),
                                                exclude: [/node_modules/],
                                            },
                                        };
                                    }
                                    return loader;
                                }),
                            };
                        }
                        return subRule;
                    }),
                };
            }
            // Xử lý rule thông thường
            if (Array.isArray(rule.use)) {
                return {
                    ...rule,
                    use: rule.use.map((loader) => {
                        if (
                            loader === "source-map-loader" ||
                            (typeof loader === "object" && loader.loader === "source-map-loader")
                        ) {
                            console.log("Found source-map-loader, applying exclude");
                            return {
                                ...loader,
                                loader: "source-map-loader",
                                options: {
                                    ...(typeof loader === "object" ? loader.options : {}),
                                    exclude: [/node_modules/],
                                },
                            };
                        }
                        return loader;
                    }),
                };
            }
        }
        return rule;
    });

    // Bỏ qua các warning về source map từ node_modules
    config.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/
    ];

    return config;
};