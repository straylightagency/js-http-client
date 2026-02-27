/**
 * @author anthony@straylightagency.be
 */
export default class Request {
    /**
     * @type {String}
     */
    url;

    /**
     * @type {String}
     */
    method;

    /**
     * @type {*}
     */
    body;

    /**
     * @type {RequestHeaders}
     */
    headers;

    /**
     * @type {RequestOptions}
     */
    options;

    /**
     * @param url {String}
     * @param method {String}
     * @param body {*}
     * @param headers {RequestHeaders}
     * @param options {RequestOptions}
     */
    constructor(url, method, body, headers, options) {
        this.url = url;
        this.method = method;
        this.body = body;
        this.headers = headers.clone();
        this.options = options.clone();
    }
}