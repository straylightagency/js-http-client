import HttpError from "./HttpError.js";

/**
 * @author anthony@straylightagency.be
 */
export default class HttpNetworkError extends HttpError {
    /**
     * @param {string} message
     */
    constructor(message = 'Network error.') {
        super(message);
        this.name = 'HttpNetworkError';
    }
}