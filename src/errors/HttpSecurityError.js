import HttpError from "./HttpError.js";

export default class HttpSecurityError extends HttpError {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(`HTTP Security Error : ${message}`);
        this.name = 'HttpSecurityError';
    }
}