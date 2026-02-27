/**
 * @author anthony@straylightagency.be
 */
export default class RequestOptions {
    /**
     * @type {string}
     */
    baseUrl = '';

    /**
     * @type {*}
     */
    catchError = undefined;

    /**
     * @type {*}
     */
    signal = undefined;

    /**
     * @type {*}
     */
    onDownloadProgress = undefined;

    /**
     * @type {*}
     */
    onUploadProgress = undefined;

    /**
     * @type {[]}
     */
    middlewares = [];

    /**
     * @type {boolean}
     */
    xmlHttpRequest = false;

    /**
     * @type {string}
     */
    responseType = '';

    /**
     * @type {string}
     */
    cache = 'default';

    /**
     * @type {string}
     */
    credentials = 'same-origin';

    /**
     * @type {string}
     */
    mode = 'cors';

    /**
     * @type {string}
     */
    priority = 'auto';

    /**
     * @type {boolean}
     */
    keepalive = false;

    /**
     * @type {string}
     */
    integrity = '';

    /**
     * @type {string}
     */
    redirect = 'follow';

    /**
     * @type {string}
     */
    referrer = 'about:client';

    /**
     * @type {*}
     */
    referrerPolicy = undefined;

    /**
     * @type {*}
     */
    privateToken = undefined;

    /**
     * @param items
     */
    constructor(items = {}) {
        Object.entries( items )
            .forEach(
                ([key, value]) => this[ key ] = value
            );
    }

    /**
     * @param key
     * @returns {RequestOptions}
     */
    delete(key) {
        delete this[ key ];

        return this;
    }

    /**
     * @param key
     * @returns {undefined|*}
     */
    get(key) {
        try {
            return this[ key ];
        } catch ( err ) {
            return undefined;
        }
    }

    /**
     * @param key
     * @returns {boolean}
     */
    has(key) {
        return this[ key ] !== undefined;
    }

    /**
     * @param key
     * @param value
     * @returns {RequestOptions}
     */
    set(key, value) {
        this[ key ] = value;

        return this;
    }

    /**
     * @param key
     * @param value
     * @returns {RequestOptions}
     */
    append(key, value) {
        this.set( key, value );

        return this;
    }

    /**
     * @returns {string[]}
     */
    keys() {
        return Object.keys( this );
    }

    /**
     * @returns {[string, any][]}
     */
    entries() {
        return Object.entries( this );
    }

    /**
     * @param callbackFn
     * @param thisArg
     * @returns {RequestOptions}
     */
    forEach(callbackFn, thisArg) {
        thisArg = thisArg || this;

        Object.entries( this ).forEach( callbackFn, thisArg );

        return this;
    }

    /**
     * @returns {any[]}
     */
    values() {
        return Object.values( this );
    }

    /**
     * @returns {{}}
     */
    all() {
        return Object.entries( this ).reduce( (acc, [key, value]) => {
            acc[ key ] = value;
            return acc;
        }, {} );
    }

    /**
     * @returns {RequestOptions}
     */
    clone() {
        return new RequestOptions( this.all() );
    }

    /**
     * @param newOptions
     * @returns {RequestOptions}
     */
    merge(newOptions = {}) {
        Object.entries( newOptions )
            .forEach(
                ([key, value]) => this[ key ] = value
            );

        return this;
    }
}