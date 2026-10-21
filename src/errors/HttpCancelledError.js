import HttpError from "./HttpError.js";

/**
 * @author anthony@straylightagency.be
 */
export default class HttpCancelledError extends HttpError {
    /**
     * @param {string} message
     */
    constructor(message = 'Request was cancelled.') {
        super(message);
        this.name = 'HttpCancelledError';
    }
}