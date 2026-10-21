import HttpError from "./HttpError.js";

/**
 * @author anthony@straylightagency.be
 */
export default class HttpResponseError extends HttpError {
    /** @type {{}} */
    #response;

    /**
     * @param {{}} response
     */
    constructor(response) {
        super(`${response.status}`);
        this.name = 'HttpResponseError';
        this.#response = response;
    }

    /**
     * @return {{}}
     */
    get response() {
        return this.#response;
    }
}