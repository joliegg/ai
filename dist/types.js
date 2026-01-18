"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = configure;
exports.getGlobalConfig = getGlobalConfig;
let globalConfig = {
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    debug: false,
};
function configure(config) {
    globalConfig = { ...globalConfig, ...config };
}
function getGlobalConfig() {
    return { ...globalConfig };
}
