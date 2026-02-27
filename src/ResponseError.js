import Response from "./Response.js";

/**
 * @author anthony@straylightagency.be
 */
export default class ResponseError extends Error {
    /**
     * @type {Number}
     */
    #status;

    /**
     * @type {String}
     */
    #reason;

    /**
     * @type {Response}
     */
    #response;

    /**
     * @param status {Number}
     * @param reason {String}
     * @param response {Response}
     */
    constructor(status, reason, response) {
        super(reason);

        this.#status = status;
        this.#reason = reason;
        this.#response = response;
    }

    /**
     * @returns {Number}
     */
    get status() {
        return this.#status;
    }

    /**
     * @returns {String}
     */
    get reason() {
        return this.#reason;
    }

    /**
     * @returns {Response}
     */
    get response() {
        return this.#response;
    }
}
