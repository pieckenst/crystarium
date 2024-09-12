class ConfigError {
    message;
    _tag = 'ConfigError';
    constructor(message) {
        this.message = message;
    }
}
class TokenError {
    message;
    _tag = 'TokenError';
    constructor(message) {
        this.message = message;
    }
}
export { ConfigError, TokenError, };
//# sourceMappingURL=harmonixtypes.js.map