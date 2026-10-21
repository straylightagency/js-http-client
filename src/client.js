import Pipeline from "./Pipeline.js";
import {HttpCancelledError, HttpError, HttpNetworkError, HttpSecurityError} from "./errors/index.js";

const HTTP_STATUS_MESSAGES = {
    // 1xx: Informations
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',

    // 2xx: Succès
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',

    // 3xx: Redirection
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',

    // 4xx: Erreurs client
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',

    // 5xx: Erreurs serveur
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
};

/**
 * @param {number} status
 * @param {string} statusText
 * @return {*|string}
 */
function getStatusText(status, statusText = null) {
    if (statusText && statusText.trim() !== '') {
        return statusText;
    }

    return HTTP_STATUS_MESSAGES[status] || (status >= 500 ? 'Server Error' : 'Client Error');
}

/**
 * @param {*} value
 * @return {boolean}
 */
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const proto = Object.getPrototypeOf(value);

    if (proto === null) {
        return true;
    }

    return proto === Object.prototype;
}

/**
 * @param {string} method
 * @return {boolean}
 */
function isRequestWithBody(method) {
    return ['POST', 'PUT', 'PATCH'].includes( method.toUpperCase() );
}

/**
 * @param {string} contentType
 * @return {*}
 */
function isBinaryContentType(contentType) {
    return contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('audio/') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/zip') ||
        contentType.includes('application/octet-stream');
}

/**
 * @param {*} value
 * @return {boolean}
 */
function isFile(value) {
    return (typeof File !== 'undefined' && value instanceof File) ||
        value instanceof Blob ||
        (typeof FileList !== 'undefined' && value instanceof FileList && value.length > 0)
}

/**
 * @param {{}|FormData} data
 * @return {boolean|boolean}
 */
function hasFiles(data) {
    if (data instanceof FormData) {
        return true;
    }

    return isFile(data) ||
        (typeof data === 'object' && data !== null && Object.values(data).some((value) => hasFiles(value)));
}

/**
 * @param {{}} params
 * @return {string}
 */
function buildQueryString(params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => searchParams.append(`${key}[]`, String(item)));
        } else if (typeof value === 'object') {
            searchParams.append(key, JSON.stringify(value));
        } else {
            searchParams.append(key, String(value));
        }
    })

    return searchParams.toString();
}

/**
 * @param {string} url
 * @param {string} baseUrl
 * @param {string} prefix
 * @param {*} params
 * @return {string}
 */
function buildUrl(url, baseUrl = null, prefix = null, params = null) {
    if (prefix &&
        ! url.startsWith('http://') &&
        ! url.startsWith('https://')
    ) {
        url = prefix.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    }

    if (baseUrl &&
        ! url.startsWith('http://') &&
        ! url.startsWith('https://')
    ) {
        url = baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    }

    if (isPlainObject(params) && Object.keys(params).length > 0) {
        url = url + '?' + buildQueryString(params);
    }

    return url;
}

/**
 * @param {FormData} formData
 * @param {string} key
 * @param {*} value
 * @return {FormData}
 */
function appendToFormData(formData, key, value) {
    if (Array.isArray(value) || value instanceof Set) {
        [...value].forEach((val, index) => {
            appendToFormData(formData, `${key}[${index}]`, val);
        });
    } else if (value instanceof Map) {
        value.forEach((val, mapKey) => {
            appendToFormData(formData, `${key}[${mapKey}]`, val);
        });
    } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
    } else if (typeof File !== 'undefined' && value instanceof File) {
        formData.append(key, value, value.name);
    } else if (value instanceof Blob) {
        formData.append(key, value);
    } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
    } else if (typeof value === 'string') {
        formData.append(key, value);
    } else if (typeof value === 'number' || typeof value === 'bigint') {
        formData.append(key, String(value));
    } else if (value === null || value === undefined) {
        formData.append(key, '');
    } else {
        toFormData(value, formData, key);
    }

    return formData;
}

/**
 * @param {*} data
 * @param {FormData} formData
 * @param {string|null} parentKey
 * @return {FormData}
 */
function toFormData(data, formData = new FormData(), parentKey = null) {
    if (data instanceof FormData) {
        for (const [key, value] of data.entries()) {
            appendToFormData(
                formData,
                parentKey ? `${parentKey}[${key}]` : key,
                value
            );
        }

        return formData;
    }

    Object.entries(data).forEach(([key, value]) => {
        appendToFormData(
            formData,
            parentKey ? `${parentKey}[${key}]` : key,
            value
        );
    });

    return formData;
}

/**
 * @param {{}|FormData|String} body
 * @param {{}} headers
 * @return {void|Uint8Array<ArrayBuffer>|undefined|FormData|ReadableStream|string}
 */
function formatBody(body, headers = {}) {
    if ( body === undefined || body === null) {
        return undefined;
    }

    if ( body instanceof ReadableStream || body instanceof FormData) {
        return body;
    }

    if ( isPlainObject(body) && hasFiles(body)) {
        return toFormData(body);
    }

    if ( isPlainObject(body) || headers['Content-Type']?.includes('application/json')) {
        return JSON.stringify(body);
    }

    return String(body);
}

/**
 * @author anthony@straylightagency.be
 */
class Client {
    /** @type {[]} */
    #middlewares = [];

    /** @type {{}} */
    #config = {};

    /**
     * @param {{}} config
     */
    constructor(config) {
        this.#config = config;
    }

    /**
     * @param {[]|function} middleware
     * @return {Client}
     */
    use(middleware) {
        if ( Array.isArray( middleware ) ) {
            middleware.forEach( item => this.use( item ) )

            return this;
        }

        this.#middlewares.push( middleware );

        return this;
    }

    /**
     * @param {{}} config
     */
    request(config = {}) {
        const headers = config.headers ?? {};
        const requestHeaders = isPlainObject( this.#config.headers ) ? {...this.#config.headers, ...headers} : headers;

        const params = config.params ?? {};
        const requestParams = isPlainObject( this.#config.params ) ? {...this.#config.params, ...params} : params;

        const requestConfig = {...this.#config, ...config, headers: requestHeaders, params: requestParams};
        const requestMiddlewares = [...this.#middlewares, ...requestConfig.middlewares || []];

        const client = this;

        return {
            /**
             * @param {function(*, *): Promise<*>} middleware
             * @return {*}
             */
            use(middleware) {
                requestMiddlewares.push( middleware );

                return this;
            },

            /**
             * @return {*}
             */
            json() {
                headers['Content-Type'] = 'application/json';

                return this;
            },

            /**
             * @param {{}} config
             * @return {Promise<*&{request: *, error: *}>}
             */
            async send(config) {
                const headers = config.headers ?? {};
                const endpointHeaders = isPlainObject( requestHeaders ) ? {...requestHeaders, ...headers} : headers;

                const params = config.params ?? {};
                const endpointParams = isPlainObject( requestParams ) ? {...requestParams, ...params} : params;

                const endpointConfig = {...requestConfig, ...config, headers: endpointHeaders, params: endpointParams};
                const endpointMiddlewares = [...requestMiddlewares, ...endpointConfig.middlewares || []];

                let context = { request: endpointConfig, middlewares: endpointMiddlewares };
                let error;
                let ok = false;

                try {
                    const pipeline = new Pipeline()
                        .send( context )
                        .through( endpointMiddlewares );

                    context = await pipeline.then( async (context) => {
                        const useXhr = ( context.request.use !== undefined && context.request.use.toLowerCase() === 'xhr' ) || typeof endpointConfig.onUploadProgress === 'function';

                        if ( context.request.use !== undefined && context.request.use.toLowerCase() === 'fetch' && typeof endpointConfig.onUploadProgress === 'function' ) {
                            console.warn( "Fetch handler is not compatible with onUploadProgress callback. Switch to XHR handler as a fallback. Edit the config with ` use: 'xhr' ` to remove this warning.", context.request );
                        }

                        const handler = useXhr ? client.xhrHandler : client.fetchHandler;
                        context.response = await handler(endpointConfig);

                        return context;
                    });

                    ok = context?.response?.ok ?? false;
                } catch (e) {
                    if ( ! ( typeof context.request.shouldCatchError === 'function' ) ) {
                        context.request.shouldCatchError = (e) => e instanceof HttpError;
                    }

                    if ( ! ( typeof context.request.catchError === 'function' ) ) {
                        context.request.catchError = (e) => e;
                    }

                    if ( context.request.shouldCatchError( e ) ) {
                        error = context.request.catchError( e );
                    } else {
                        throw e;
                    }
                }

                return {request: context.request, ...context.response, ok, error};
            },

            /**
             * @param {string} url
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async get(url, config = {}) {
                return await this.send( {
                    method: 'GET',
                    url,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async head(url, config = {}) {
                return await this.send( {
                    method: 'HEAD',
                    url,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async query(url, config = {}) {
                return await this.send( {
                    method: 'QUERY',
                    url,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async delete(url, config = {}) {
                return await this.send( {
                    method: 'DELETE',
                    url,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async post(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'POST',
                    url,
                    body,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async postForm(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'POST',
                    url,
                    body: toFormData(body),
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async put(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'PUT',
                    url,
                    body,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async putForm(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'PUT',
                    url,
                    body: toFormData(body),
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async patch(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'PATCH',
                    url,
                    body,
                    ...config,
                }  );
            },

            /**
             * @param {string} url
             * @param {{}} body
             * @param {{}} config
             * @return {Promise<*&{error: *, request: *}>}
             */
            async patchForm(url, body = {}, config = {}) {
                return await this.send( {
                    method: 'PATCH',
                    url,
                    body: toFormData(body),
                    ...config,
                }  );
            }
        }
    }

    /**
     * @param {{}} config
     * @return {Promise<*>}
     */
    async send(config) {
        return this.request(config).send({});
    }

    /**
     * @param {{}} config
     * @return {Promise<{status: number, data: *, headers: {}}>}
     */
    async fetchHandler(config) {
        const url = buildUrl(config.url, config.baseUrl, config.prefix, config.params);
        const method = config.method.toUpperCase();
        const headers = Object.fromEntries( Object.entries( config.headers && isPlainObject(config.headers) ? config.headers : {} )
            .map( ([key, value]) => [ key, String(value), ] ) );
        const credentials = config.credentials ?? 'same-origin';
        const signal = config.signal instanceof AbortSignal ? config.signal : undefined;
        const body = isRequestWithBody(method) ? formatBody(config.body, headers) : undefined;

        if (headers['Content-Type'] === undefined && body !== undefined && isPlainObject(body) && !hasFiles(body)) {
            headers['Content-Type'] = 'application/json';
        }

        if (body !== undefined && body instanceof FormData) {
            delete headers['Content-Type'];
        }

        return new Promise( async (resolve, reject) => {
            try {
                const requestOptions = {
                    method,
                    headers,
                    body,
                    signal,
                    credentials,
                };

                const response = ( response => {
                    if ( ! response.body || typeof config.onDownloadProgress !== 'function') {
                        return response;
                    }

                    const totalHeader = response.headers.get('content-length');
                    const total = totalHeader ? parseInt(totalHeader, 10) : 0;
                    let loaded = 0;

                    const reader = response.body.getReader();
                    const streamedStream = new ReadableStream({
                        async start(controller) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                loaded += value.byteLength;

                                config.onDownloadProgress( {
                                    lengthComputable: total > 0,
                                    loaded,
                                    total,
                                } );

                                controller.enqueue(value);
                            }
                            controller.close();
                        },
                    });

                    return new Response( streamedStream, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                    });
                } )( await fetch( url, requestOptions ) );

                const responseType = config.responseType || 'json';
                const contentType = response.headers.get('content-type') || '';

                if (isBinaryContentType( contentType ) && (responseType === 'text' || responseType === 'json')) {
                    reject( new HttpSecurityError(
                        `Attempted to read binary content-type ("${contentType}") as "${responseType}". ` +
                        `Please use { responseType: 'blob' } or { responseType: 'arrayBuffer' } instead.`
                    ) );
                }

                let data;

                switch (responseType) {
                    case 'blob':
                        data = await response.blob();
                        break;
                    case 'arrayBuffer':
                        data = await response.arrayBuffer();
                        break;
                    case 'formData':
                        data = await response.formData();
                        break;
                    case 'text':
                        data = await response.text();
                        break;
                    case 'json':
                    default:
                        const text = await response.text();
                        try {
                            data = text ? JSON.parse(text) : null;
                        } catch (e) {
                            data = text;
                        }
                }

                const httpResponse = {
                    status: response.status,
                    statusText: getStatusText( response.status, response.statusText ),
                    ok: response.ok,
                    headers: Object.fromEntries(
                        Array.from(response.headers.entries()).map(([key, value]) => [key.toLowerCase(), value])
                    ),
                    data,
                };

                return resolve( httpResponse );
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return reject(new HttpCancelledError());
                }

                if (error instanceof TypeError) {
                    return reject(new HttpNetworkError(error.message));
                }

                return reject(error);
            }
        });
    }

    /**
     * @param {{}} config
     * @return {Promise<unknown>}
     */
    async xhrHandler(config) {
        const url = buildUrl(config.url, config.baseUrl, config.prefix, config.params);
        const method = typeof config.method === 'string' ? config.method.toUpperCase() : 'GET';
        const headers = Object.fromEntries( Object.entries( config.headers && isPlainObject(config.headers) ? config.headers : {} )
            .map( ([key, value]) => [ key, String(value), ] ) );
        const signal = config.signal && config.signal instanceof AbortSignal ? config.signal : undefined;
        const body = isRequestWithBody(method) ? formatBody(config.body, headers) : undefined;
        const responseType = config.responseType || 'json';

        if (headers['Content-Type'] === undefined && body !== undefined && isPlainObject(body) && !hasFiles(body)) {
            headers['Content-Type'] = 'application/json';
        }

        if (body !== undefined && body instanceof FormData) {
            delete headers['Content-Type'];
        }

        return new Promise( (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open( method, url, true );
            xhr.withCredentials = config.credentials ?? false;
            xhr.responseType = responseType === 'json' || responseType === 'formData' ? 'text' : responseType.toLowerCase();

            signal && signal.addEventListener('abort', () => xhr.abort() );

            Object.entries( headers ).forEach( ([key, value]) => xhr.setRequestHeader( key, value ) );

            xhr.addEventListener( 'load', () => {
                const headers = ( string => string.trim().split(/[\r\n]+/)
                    .reduce( ( acc, line) => {
                        const parts = line.split(": ");
                        return {...acc, [parts[0].toLowerCase()]: parts[1]};
                    }, {} ) )( xhr.getAllResponseHeaders() );

                const contentType = headers['content-type'] || '';

                if (isBinaryContentType( contentType ) && (responseType === 'text' || responseType === 'json')) {
                    return reject(new HttpSecurityError(
                        `Attempted to read binary content-type ("${contentType}") as "${responseType}" via XHR. ` +
                        `Please use { responseType: 'blob' } or { responseType: 'arrayBuffer' } instead.`
                    ));
                }

                let data;

                switch (responseType) {
                    case 'blob':
                    case 'arrayBuffer':
                    case 'formData':
                        data = xhr.response;
                        break;
                    case 'text':
                        data = xhr.responseText;
                        break;
                    case 'json':
                    default:
                        const text = xhr.responseText;
                        try {
                            data = text ? JSON.parse(text) : null;
                        } catch (e) {
                            data = text;
                        }
                }

                return resolve( {
                    status: xhr.status,
                    statusText: getStatusText( xhr.status, xhr.statusText ),
                    ok: xhr.status >= 200 && xhr.status < 300,
                    headers,
                    data,
                } );
            } );

            xhr.addEventListener( 'error', () => reject( new HttpNetworkError() ) );
            xhr.upload.addEventListener( 'error', () => reject( new HttpNetworkError() ) );
            xhr.addEventListener( 'abort', () => reject( new HttpCancelledError() ) );
            xhr.upload.addEventListener( 'abort', () => reject( new HttpCancelledError() ) );

            typeof config.onDownloadProgress === 'function' ? xhr.addEventListener( 'progress', event => config.onDownloadProgress( {
                lengthComputable: event.lengthComputable,
                loaded: event.loaded,
                total: event.total,
            } ) ) : undefined;

            typeof config.onUploadProgress === 'function' ? xhr.upload.addEventListener( 'progress', event => config.onUploadProgress( {
                lengthComputable: event.lengthComputable,
                loaded: event.loaded,
                total: event.total,
            } ) ) : undefined;

            if (body && isRequestWithBody( method )) {
                xhr.send( body );
            } else {
                xhr.send();
            }
        } );
    }
}

/**
 * @param {{}} config
 * @return {{use(function): *, request({}=): {use(function(*, *): Promise<*>): *, send({}): Promise<*>, get(string, {}=): Promise<*>, head(string, {}=): Promise<*>, query(string, {}=): Promise<*>, delete(string, {}=): Promise<*>, post(string, {}=, {}=): Promise<*>, put(string, {}=, {}=): Promise<*>, patch(string, {}=, {}=): Promise<*>}, get(string, {}=): Promise<*>, head(string, {}=): Promise<*>, query(string, {}=): Promise<*>, delete(string, {}=): Promise<*>, post(string, {}=, {}=): Promise<*>, put(string, {}=, {}=): Promise<*>, patch(string, {}=, {}=): Promise<*>}|{use(function(*, *): Promise<*>): *, send({}): Promise<*>, get(string, {}=): Promise<*>, head(string, {}=): Promise<*>, query(string, {}=): Promise<*>, delete(string, {}=): Promise<*>, post(string, {}=, {}=): Promise<*>, put(string, {}=, {}=): Promise<*>, patch(string, {}=, {}=): Promise<*>}|*}
 */
export default function createClient(config = {}) {
    const client = new Client(config);

    return {
        /**
         * @param {[]|function} middleware
         * @return {*}
         */
        use(middleware) {
            if ( Array.isArray( middleware ) ) {
                middleware.forEach( item => this.use( item ) )

                return this;
            }

            client.use( middleware );

            return this;
        },

        /**
         * @param {{}} config
         * @return {{use(*): this, send(*): Promise<*&{request: *}>, get(*, {}=): Promise<*>, head(*, {}=): Promise<*>, query(*, {}=): Promise<*>, delete(*, {}=): Promise<*>, post(*, {}=, {}=): Promise<*>, put(*, {}=, {}=): Promise<*>, patch(*, {}=, {}=): Promise<*>}}
         */
        request(config = {}) {
            return client.request(config);
        },

        /**
         * @param {{}} config
         */
        json(config) {
            const {headers = {}} = config;

            headers['Content-Type'] = 'application/json';

            return client.request({...config, headers});
        },

        /**
         * @param {string} url
         * @param {{}} config
         * @return {Promise<*>}
         */
        async get(url, config = {}) {
            return await this.request().get(url, config);
        },

        /**
         * @param {string} url
         * @param {{}} config
         * @return {Promise<*>}
         */
        async head(url, config = {}) {
            return await this.request().head(url, config);
        },

        /**
         @param {string} url
         @param {{}} config
         * @return {Promise<*>}
         */
        async query(url, config = {}) {
            return await this.request().query(url, config);
        },

        /**
         @param {string} url
         @param {{}} config
         * @return {Promise<*>}
         */
        async delete(url, config = {}) {
            return await this.request().delete(url, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async post(url, body = {}, config = {}) {
            return await this.request().post(url, body, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async postForm(url, body = {}, config = {}) {
            return await this.request().postForm(url, body, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async put(url, body = {}, config = {}) {
            return await this.request().put(url, body, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async putForm(url, body = {}, config = {}) {
            return await this.request().putForm(url, body, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async patch(url, body = {}, config = {}) {
            return await this.request().patch(url, body, config);
        },

        /**
         * @param {string} url
         * @param {{}} body
         * @param {{}} config
         * @return {Promise<*>}
         */
        async patchForm(url, body = {}, config = {}) {
            return await this.request().patchForm(url, body, config);
        },
    }
}