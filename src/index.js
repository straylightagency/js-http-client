import Client from "./Client";
import RequestOptions from "./RequestOptions";
import RequestHeaders from "./RequestHeaders";
import ResponseError from "./ResponseError";
import serialize from "@straylightagency/utils/src/string/serialize.js";

/**
 * @type {RequestHeaders}
 */
export const requestHeaders = new RequestHeaders();

/**
 * @type {RequestOptions}
 */
export const requestOptions = new RequestOptions();

/**
 * @param url
 * @returns {Client}
 */
export function useRequest(url) {
    return new Client( url );
}

/**
 * @param response
 * @returns {ResponseError}
 */
export function useError(response) {
    return new ResponseError( response.status, response.statusText, response );
}

/**
 * @returns {AbortController}
 */
export function useSignal() {
    return new AbortController();
}

/**
 * @param timeoutMs
 * @returns {AbortSignal}
 */
export function useTimeout(timeoutMs) {
    return AbortSignal.timeout( timeoutMs );
}

/**
 * @param headers
 */
export function withHeaders(headers) {
    requestHeaders.merge( headers );
}

/**
 * @param options
 */
export function withOptions(options) {
    requestOptions.merge( options );
}

/**
 * @param callbackFn
 */
export function withCatchError(callbackFn) {
    requestOptions.catchError = callbackFn;
}

/**
 * @param middlewares
 */
export function withMiddlewares(middlewares) {
    requestOptions.middlewares = middlewares;
}

/**
 * @param value
 */
export function withXmlHttpRequest(value = true) {
    requestOptions.xmlHttpRequest = value;
}

/**
 * @param callbackFn
 */
export function withDownloadProgress(callbackFn) {
    requestOptions.onDownloadProgress = callbackFn;
}

/**
 * @param callbackFn
 */
export function withUploadProgress(callbackFn) {
    requestOptions.onUploadProgress = callbackFn;
}

/**
 * @param uri
 * @param params
 * @returns {*}
 */
export function encodeUrl(uri, params = {}) {
    let queryString;

    if ( Array.isArray( params ) ) {
        queryString = params.map( key => encodeURIComponent( key ) ).join('&');
    }

    if ( typeof params === "object" ) {
        queryString = serialize( params );
    }

    return uri + ( queryString !== '' ? '?' + queryString : '' );
}