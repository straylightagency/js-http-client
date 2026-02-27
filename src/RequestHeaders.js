/**
 * @author anthony@straylightagency.be
 */
export default class RequestHeaders {
    /**
     * @type {{}}
     */
    #items = {};

    /**
     * @param items {{}}
     */
    constructor(items = {}) {
        Object.entries( items )
            .forEach(
                ([key, value]) => this.#items[ key ] = value
            );
    }

    /**
     * @param key {String}
     * @returns {RequestHeaders}
     */
    delete(key) {
        delete this.#items[ key ];

        return this;
    }

    /**
     * @param key {String}
     * @returns {undefined|*}
     */
    get(key) {
        try {
            return this.#items[ key ];
        } catch ( err ) {
            return undefined;
        }
    }

    /**
     * @param key {String}
     * @returns {boolean}
     */
    has(key) {
        return this.#items[ key ] !== undefined;
    }

    /**
     * @param key {String}
     * @param value {*}
     * @returns {RequestHeaders}
     */
    set(key, value) {
        this.#items[ key ] = value;

        return this;
    }

    /**
     * @param key {String}
     * @param value {*}
     * @returns {RequestHeaders}
     */
    append(key, value) {
        this.set( key, value );

        return this;
    }

    /**
     * @returns {string[]}
     */
    keys() {
        return Object.keys( this.#items );
    }

    /**
     * @returns {[string, any][]}
     */
    entries() {
        return Object.entries( this.#items );
    }

    /**
     * @returns {any[]}
     */
    values() {
        return Object.values( this.#items );
    }

    /**
     * @returns {{}}
     */
    all() {
        return this.#items;
    }

    /**
     * @param callbackFn {Function}
     * @param thisArg {*}
     * @returns {RequestHeaders}
     */
    forEach(callbackFn, thisArg) {
        thisArg = thisArg || this;

        Object.entries( this.#items ).forEach( callbackFn, thisArg );

        return this;
    }

    /**
     * @returns {RequestHeaders}
     */
    clone() {
        return new RequestHeaders( this.#items );
    }

    /**
     * @param newHeaders {Object}
     * @returns {RequestHeaders}
     */
    merge(newHeaders = {}) {
        this.#items = Object.assign( this.#items, newHeaders );

        return this;
    }
}