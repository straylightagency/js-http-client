/**
 * @author anthony@straylightagency.be
 */
export default class Response {
    /**
     * @type {String}
     */
    #body;

    /**
     * @type {Number}
     */
    #status;

    /**
     * @type {String}
     */
    #statusText;

    /**
     * @type {ResponseHeaders}
     */
    #headers;

    /**
     * @type {RequestOptions}
     */
    #options;

    /**
     * @param body {String}
     * @param status {Number}
     * @param statusText {String}
     * @param headers {ResponseHeaders}
     * @param options {RequestOptions}
     */
    constructor(body, status, statusText, headers, options) {
        this.#body = body;
        this.#status = status;
        this.#statusText = statusText;
        this.#headers = headers;
        this.#options = options;
    }

    /**
     * @returns {String}
     */
    get body() {
        return this.#body;
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
    get statusText() {
        return this.#statusText;
    }

    /**
     * @returns {ResponseHeaders}
     */
    get headers() {
        return this.#headers;
    }

    /**
     * @returns {RequestOptions}
     */
    get options() {
        return this.#options;
    }
}
