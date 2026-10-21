import HttpError from "./HttpError.js";

/**
 * @author anthony@straylightagency.be
 */
export default class HttpDuplicateError extends HttpError {
    /**
     * @param {string} message
     */
    constructor(message = 'A duplicate request is already in progress.') {
        super(message);
        this.name = 'HttpDuplicateError';
    }
}