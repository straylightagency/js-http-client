import {requestHeaders, requestOptions, useTimeout} from "./index.js";
import Pipeline from "./Pipeline.js";
import Request from "./Request.js";
import Response from "./Response.js";
import ResponseHeaders from "./ResponseHeaders.js";
import ResponseError from "./ResponseError.js";
import {isClass, isPlainObject} from "@straylightagency/utils/misc/is.js";

/**
 * @param object {{}}
 * @returns {boolean}
 */
function isFormObject(object) {
    return isClass( object, 'FormData' );
}

/**
 * @param method {String}
 * @returns {boolean}
 */
function isRequestWithBody(method) {
    return ['POST', 'PUT', 'PATCH'].includes( method.toUpperCase() );
}

/**
 * @param object {{}}
 * @returns {*|FormData}
 */
function objectToFormData(object) {
    if ( isFormObject( object ) ) {
        return object;
    }

    object = Object.entries( object ).reduce( ( form, [ key, value ] ) => {
        if ( typeof value === 'number' ) {
            value = value.toString();
        }

        if ( !( typeof value === 'string' ) ) {
            value = JSON.stringify( value );
        }

        form.append( key, value );

        return form;
    }, new FormData() );

    return object;
}

/**
 * @param url {String}
 * @param method {String}
 * @param body {*}
 * @param headers {RequestHeaders}
 * @param options {RequestOptions}
 * @returns {Promise<*>}
 */
async function createFetchHandler(url, method, body, headers, options) {
    const middlewares = options.middlewares ?? [];

    const pipeline = new Pipeline()
        .send( new Request( url, method, body, headers, options ) )
        .through( middlewares );

    if ( options.catchError ) {
        pipeline.catch( options.catchError );
    }

    return await pipeline
        .then( async request => {
            const options = request.options;

            const requestOptions = {
                method: request.method,
                headers: new Headers( request.headers.all() ),
                cache: options.cache,
                credentials: options.credentials,
                mode: options.mode,
                priority: options.priority,
                keepalive: options.keepalive,
                integrity: options.integrity,
                redirect: options.redirect,
                referrer: options.referrer,
            };

            if ( isRequestWithBody( request.method ) ) {
                requestOptions.body = request.body;
            }

            if ( options.referrerPolicy ) {
                requestOptions.referrerPolicy = options.referrerPolicy;
            }

            if ( options.signal ) {
                requestOptions.signal = options.signal;
            }

            if ( options.privateToken ) {
                requestOptions.privateToken = options.privateToken;
            }

            const url = options.baseUrl ? options.baseUrl + request.url : request.url;

            const buildResponse = (body, status, statusText, headers = {}) => {
                return new Response( body, status, statusText, new ResponseHeaders( headers ), options.clone() );
            };

            try {
                const response = await fetch( url, requestOptions );
                const headers = response.headers;

                const contentType = headers.get('Content-Type');

                const wrapResponse = async body => await new Promise(resolve => {
                    resolve( buildResponse( body, response.status, response.statusText, headers ) );
                } );

                if ( contentType && contentType.includes('json') ) {
                    return response.json().then( wrapResponse );
                }

                if ( contentType && contentType.includes('image', 0 ) ) {
                    return response.blob().then( wrapResponse );
                }

                if ( contentType && ( contentType.includes('video', 0 ) || contentType.includes('audio', 0 ) ) ) {
                    return response.arrayBuffer().then( wrapResponse );
                }

                return response.text().then( wrapResponse );
            } catch (err) {
                throw new ResponseError( 0, err, buildResponse('', 0, err, {} ) );
            }
        } );
}

/**
 * @param url {String}
 * @param method {String}
 * @param body {*}
 * @param headers {RequestHeaders}
 * @param options {RequestOptions}
 * @returns {Promise<*>}
 */
async function createXMLHttpRequestHandler(url, method, body, headers, options = {}) {
    const middlewares = options.middlewares ?? [];

    const stringToHeaders = string => {
        let headers;

        if ( string.length === 0 ) {
            headers = {};
        } else {
            headers = string.trim().split(/[\r\n]+/)
                .reduce( ( acc, line) => {
                    const parts = line.split(": ");
                    const header = parts.shift();
                    acc[ header ] = parts;
                    return acc;
                }, {} );
        }

        return new ResponseHeaders( headers );
    }

    const buildResponse = (body, status, statusText, headers = '') => {
        const responseHeaders = stringToHeaders( headers );
        const contentType = responseHeaders.get('Content-Type');

        if ( contentType && typeof body === 'string' ) {
            if ( contentType.includes('json') ) {
                body = JSON.parse( body );
            }

            if ( contentType.includes('image') ) {
                body = new Blob( body );
            }

            if ( contentType.includes('video') || contentType.includes('audio') ) {
                throw 'Video and Audio can only be received if the option `responseType` is set on `arraybuffer`';
            }
        }

        return new Response( body, status, statusText, responseHeaders, options.clone() );
    };

    const pipeline = new Pipeline()
        .send( new Request( url, method, body, headers, options ) )
        .through( middlewares );

    if ( options.catchError ) {
        pipeline.catch( options.catchError );
    }

    return await pipeline
        .then( async request => await new Promise( ( resolve, reject ) => {
            const headers = request.headers;
            const options = request.options;
            const method = request.method;
            const signal = options.signal;
            const url = options.baseUrl ? options.baseUrl + request.url : request.url;

            const xhr = new XMLHttpRequest();
            xhr.open( method, url, true );

            xhr.responseType = options.responseType;

            if ( isPlainObject( body ) ) {
                headers.set('Content-Type', 'application/json');
                body = JSON.stringify( body );
            }

            if ( isFormObject( body ) ) {
                headers.delete('Content-Type');
            }

            headers.forEach( ([key, value]) => xhr.setRequestHeader( key, value ) );

            const onLoadCallback = () => {
                const response = xhr.responseType === '' || xhr.responseType === 'text' ? xhr.responseText : xhr.response;
                const responseBag = buildResponse( response, xhr.status, xhr.statusText, xhr.getAllResponseHeaders() );

                resolve( responseBag );
            };

            const onErrorCallback = () => {
                const response = xhr.responseType === '' || xhr.responseType === 'text' ? xhr.responseText : xhr.response;
                const responseBag = buildResponse( response, xhr.status, xhr.statusText, xhr.getAllResponseHeaders() );

                reject( new ResponseError( xhr.status, xhr.statusText, responseBag ) );
            };

            const onAbortCallback = () => {
                reject( new ResponseError( 0, signal.reason, buildResponse( '', 0, signal.reason ) ) );
            };

            xhr.addEventListener( 'load', onLoadCallback );

            xhr.addEventListener( 'error', onErrorCallback );
            xhr.upload.addEventListener( 'error', onErrorCallback );

            xhr.addEventListener( 'abort', onAbortCallback );
            xhr.upload.addEventListener( 'abort', onAbortCallback );

            const onDownloadProgressCallback = options.onDownloadProgress || undefined;
            const onUploadProgressCallback = options.onUploadProgress || undefined;

            onDownloadProgressCallback && xhr.addEventListener( 'progress', onDownloadProgressCallback )
            onUploadProgressCallback && xhr.upload.addEventListener( 'progress', onUploadProgressCallback )

            signal && signal.addEventListener('abort', () => xhr.abort() );

            if ( isRequestWithBody( method ) && body ) {
                xhr.send( body );
            } else {
                xhr.send();
            }
        } ) );
}

/**
 * @param useXMLHttpRequest {boolean}
 * @returns {(function(*, *, *, *, {}=): Promise<*>)|(function(*, *, *, *, *): Promise<*>)}
 */
function createRequestHandler(useXMLHttpRequest) {
    if ( window.fetch && !useXMLHttpRequest ) {
        return createFetchHandler;
    } else {
        return createXMLHttpRequestHandler;
    }
}

/**
 * @author anthony@straylightagency.be
 */
export default class Client {
    /**
     * @type {String}
     */
    #url;

    /**
     * @type {RequestHeaders}
     */
    #headers;

    /**
     * @type {RequestOptions}
     */
    #options;

    /**
     * @param url {String}
     */
    constructor(url) {
        this.#url = url;
        this.#headers = requestHeaders.clone();
        this.#options = requestOptions.clone();
    }

    /**
     * @param headers {{}}
     * @returns {Client}
     */
    withHeaders(headers) {
        this.#headers.merge( headers );

        return this;
    }

    /**
     * @param options {{}}
     * @returns {Client}
     */
    withOptions(options) {
        this.#options.merge( options );

        return this;
    }

    /**
     * @param callbackFn {Function}
     * @returns {Client}
     */
    withCatchError(callbackFn) {
        this.#options.catchError = callbackFn;

        return this;
    }

    /**
     * @param callbackFn {Function}
     * @returns {Client}
     */
    withDownloadProgress(callbackFn) {
        this.#options.onDownloadProgress = callbackFn;

        return this;
    }

    /**
     * @param callbackFn {Function}
     * @returns {Client}
     */
    withUploadProgress(callbackFn) {
        this.#options.onUploadProgress = callbackFn;

        return this;
    }

    /**
     * @param middlewares {[]}
     * @returns {Client}
     */
    withMiddlewares(middlewares) {
        this.#options.middlewares = middlewares;

        return this;
    }

    /**
     * @param timeoutMs {Number}
     * @returns {Client}
     */
    withTimeout(timeoutMs) {
        return this.withSignal( useTimeout( timeoutMs ) );
    }

    /**
     * @param signal {AbortSignal}
     * @returns {Client}
     */
    withSignal(signal) {
        this.#options.signal = signal;

        return this;
    }

    /**
     * @param value {boolean}
     * @returns {Client}
     */
    withXmlHttpRequest(value = true) {
        this.#options.xmlHttpRequest = value;

        return this;
    }

    /**
     * @returns {Client}
     */
    formUrlEncoded() {
        this.#headers.set('Content-Type', 'application/x-www-form-urlencoded');

        return this;
    }

    /**
     * @returns {Client}
     */
    formData() {
        this.#headers.set('Content-Type', 'multipart/form-data');

        return this;
    }

    /**
     * @returns {Client}
     */
    json() {
        this.#options.set('Content-Type', 'application/json');

        return this;
    }

    /**
     * @param method {String}
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async request(method, data) {
        const useXhr = this.#options.onDownloadProgress || this.#options.onUploadProgress || this.#options.xmlHttpRequest || false;

        const handler = createRequestHandler( useXhr );

        return await handler( this.#url,method, data, this.#headers, this.#options );
    }

    /**
     * @returns {Promise<*>}
     */
    async get() {
        return await this.request( 'get', {} );
    }

    /**
     * @returns {Promise<*>}
     */
    async head() {
        return await this.request( 'head', {} );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async post(data) {
        return await this.request( 'post', data );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async postForm(data) {
        return await this.request( 'post', objectToFormData( data ) );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async put(data) {
        return await this.request( 'put', data );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async putForm(data) {
        return await this.request( 'put', objectToFormData( data ) );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async patch(data) {
        return await this.request( 'patch', data );
    }

    /**
     * @param data {{}}
     * @returns {Promise<*>}
     */
    async patchForm(data) {
        return await this.request( 'patch', objectToFormData( data ) );
    }

    /**
     * @returns {Promise<*>}
     */
    async delete() {
        return await this.request( 'delete', {} );
    }

    /**
     * @returns {String}
     */
    get url() {
        return this.#url;
    }

    /**
     * @returns {RequestHeaders}
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