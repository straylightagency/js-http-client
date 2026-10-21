import {
    HttpError,
    HttpNetworkError,
    HttpResponseError,
    HttpSecurityError,
    HttpDuplicateError,
    HttpCancelledError,
} from "./errors/index.js";

import {
    withConcurrency,
    withDeduplicate,
    withLatest,
    withLogger,
    withRetry,
    withTimeout,
    withValidationStatus
} from './middlewares/index.js';

import createClient from "./Client.js";

export default createClient;

export {
    withConcurrency,
    withDeduplicate,
    withLatest,
    withLogger,
    withRetry,
    withTimeout,
    withValidationStatus,
    HttpError,
    HttpCancelledError,
    HttpNetworkError,
    HttpResponseError,
    HttpSecurityError,
    HttpDuplicateError
};