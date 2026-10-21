/**
 * @author anthony@straylightagency.be
 */
export default class HttpError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(`HTTP Error : ${message}`);
        this.name = 'HttpError';
    }
}