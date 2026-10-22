# @straylightagency/http-client

A lightweight JavaScript HTTP client for browser applications, built on the native `fetch` API with an `XMLHttpRequest` fallback for upload progress events.

It provides a small, configurable API for common HTTP methods, request defaults, response parsing, and composable middleware.

## Features

- Native ES modules and no external dependencies.
- `fetch` as the default request handler, with `XMLHttpRequest` support when needed.
- Client-wide and per-request configuration.
- Query parameter and JSON body handling.
- `FormData` support, including objects that contain files.
- Upload and download progress callbacks.
- Configurable middleware for retries, timeouts, concurrency, deduplication, and more.
- Structured response objects and dedicated HTTP error classes.

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Creating a client](#creating-a-client)
- [Configuration options](#configuration-options)
- [Making requests](#making-requests)
- [Responses and errors](#responses-and-errors)
- [Middleware](#middleware)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install @straylightagency/http-client
```

## Quick start

```js
import createClient from '@straylightagency/http-client';

const api = createClient({
    baseUrl: 'https://api.example.com',
    headers: {
        Accept: 'application/json',
    },
});

const {data, ok, status, statusText, error} = await api.get('/users', {
    params: {
        page: 1,
    },
});

if (error) {
    throw error;
}

if (!ok) {
    throw new Error(`HTTP ${status}: ${statusText}`);
}

console.log(data);
```

HTTP error statuses such as `404` and `500` are represented by `response.ok === false`; they do not, by themselves, reject the promise. See [Responses and errors](#responses-and-errors).

## Creating a client

Use `createClient()` to configure defaults shared by requests:

```js
const api = createClient({
    baseUrl: 'https://api.example.com',
    prefix: 'v1',
    headers: {
        Accept: 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
    },
    params: {
        locale: 'en',
    },
});
```

With this configuration, `api.get('/users')` targets `https://api.example.com/v1/users?locale=en`.

Request-level options can override client defaults. Query parameters and headers are merged with the client-level values:

```js
const response = await api.get('/users', {
    headers: {
        'X-Request-ID': 'example',
    },
    params: {
        page: 2,
    },
});
```

### Configuration options

| Option | Description |
| --- | --- |
| `baseUrl` | Base URL used for relative request URLs. |
| `prefix` | Path prefix added to relative URLs before `baseUrl` is applied. Useful for API versions such as `v1`. |
| `headers` | Default request headers as an object. |
| `params` | Default query parameters. Per-request values are merged with these defaults. |
| `credentials` | Fetch credentials mode. Defaults to `same-origin`. |
| `middlewares` | Middleware functions to apply to requests. |
| `use` | Select the request handler with `'fetch'` or `'xhr'`. Fetch is used by default; an upload-progress callback selects XHR. |
| `responseType` | Response parsing mode. The default is `'json'`; supported modes include `'text'`, `'blob'`, `'arrayBuffer'`, and `'formData'`, subject to handler compatibility. |
| `signal` | An `AbortSignal` used to cancel a request. |
| `timeout` | Request timeout in milliseconds when the timeout middleware is enabled. |
| `onUploadProgress` | Callback receiving upload progress information. This uses `XMLHttpRequest`. |
| `onDownloadProgress` | Callback receiving download progress information. |
| `shouldCatchError` | Function deciding whether a thrown error should be returned in the `error` property. Defaults to catching errors that extend `HttpError`. |
| `catchError` | Function that transforms a caught error. Defaults to returning the error unchanged. |

These options can be supplied when creating a client or, where relevant, to an individual request.

## Making requests

The client exposes the following methods:

| Method | Usage |
| --- | --- |
| `get(url, config?)` | Send a `GET` request. |
| `head(url, config?)` | Send a `HEAD` request. |
| `query(url, config?)` | Send a `QUERY` request. Support for this method depends on the server. |
| `delete(url, config?)` | Send a `DELETE` request. |
| `post(url, body?, config?)` | Send a `POST` request. |
| `put(url, body?, config?)` | Send a `PUT` request. |
| `patch(url, body?, config?)` | Send a `PATCH` request. |
| `send(url, method?, config?)` | Send a request using a specified HTTP method. |

The `config` argument accepts request options such as `headers`, `params`, `signal`, `responseType`, and progress callbacks.

### Sending JSON

Plain JavaScript objects passed as request bodies are serialized as JSON when no explicit `Content-Type` header is set:

```js
const response = await api.post('/users', {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
});
```

### Sending files and `FormData`

You can pass a `FormData` instance directly:

```js
const formData = new FormData();
formData.append('name', 'Ada Lovelace');
formData.append('avatar', fileInput.files[0]);

const response = await api.post('/users', formData);
```

Plain objects containing files are also converted to `FormData`:

```js
const response = await api.post('/users', {
    name: 'Ada Lovelace',
    avatar: fileInput.files[0],
});
```

When sending `FormData`, do not set the `Content-Type` header manually. The browser needs to add the multipart boundary itself.

### Upload and download progress

Progress callbacks receive an object with `loaded`, `total`, and `lengthComputable` properties:

```js
await api.post('/uploads', formData, {
    onUploadProgress({ loaded, total, lengthComputable }) {
        if (lengthComputable) {
            console.log(`Uploaded ${Math.round((loaded / total) * 100)}%`);
        }
    },
});
```

Setting `onUploadProgress` selects `XMLHttpRequest`, since Fetch does not provide a standard upload-progress callback. `onDownloadProgress` is also available:

```js
await api.get('/downloads/archive', {
    onDownloadProgress({ loaded, total, lengthComputable }) {
        if (lengthComputable) {
            console.log(`Downloaded ${Math.round((loaded / total) * 100)}%`);
        }
    },
});
```

You can select the handler explicitly with `use: 'fetch'` or `use: 'xhr'`.

## Responses and errors

A completed HTTP request returns a response object containing these fields:

| Property | Description |
| --- | --- |
| `request` | The request configuration used for the request. |
| `status` | HTTP status code. |
| `statusText` | HTTP status text. |
| `ok` | `true` when the HTTP status indicates success; otherwise `false`. |
| `headers` | Response headers. |
| `data` | Parsed response body. JSON is attempted by default; if parsing fails, the response text is returned. |
| `error` | A caught error, if one occurred. Otherwise, `undefined`. |

Network and cancellation errors that extend `HttpError` are caught by default and returned in `response.error`. Errors not accepted by `shouldCatchError` are thrown and must be handled with `try...catch`.

For example:

```js
try {
    const response = await api.get('/users/1');

    if (response.error) {
        throw response.error;
    }

    if (!response.ok) {
        console.error(`Request failed with status ${response.status}`);
    } else {
        console.log(response.data);
    }
} catch (error) {
    console.error('The request could not be completed:', error);
}
```

HTTP status codes outside the success range do not automatically become exceptions. Use `withValidationStatus()` if a request should treat certain statuses as errors.

### Exported error classes

The package exports these error classes:

- `HttpError`
- `HttpCancelledError`
- `HttpNetworkError`
- `HttpResponseError`
- `HttpSecurityError`
- `HttpDuplicateError`

They can be imported when you need to distinguish error types:

```js
import {
    HttpCancelledError,
    HttpNetworkError,
} from '@straylightagency/http-client';
```

## Middleware

Middleware lets you add behavior without embedding it in each request. Register middleware on the client with `.use()`:

```js
import createClient, {
    withConcurrency,
    withRetry,
} from '@straylightagency/http-client';

const api = createClient({
    baseUrl: 'https://api.example.com',
}).use([
    withRetry(2, 500),
    withConcurrency(5),
]);
```

Middleware runs in registration order on the way into the request and unwinds in reverse order when the request completes. You can also register a middleware on a configured request:

```js
import { withTimeout } from '@straylightagency/http-client';

const response = await api
    .request()
    .use(withTimeout(5_000))
    .get('/users');
```

### Available middleware

| Middleware | Parameters | Purpose |
| --- | --- | --- |
| `withConcurrency(limit = 5)` | Maximum number of concurrent requests. | Queues requests when the concurrency limit is reached. |
| `withDeduplicate(signature?)` | Optional function used to derive a request signature. | Rejects a new request when another request with the same signature is still in progress. By default, the signature is the HTTP method and URL. |
| `withLatest(signature?)` | Optional function used to derive a request signature. | Aborts the previous in-flight request with the same signature when a new one starts. The default signature uses the HTTP method and URL. |
| `withLogger(enabled?)` | Whether logging is enabled. | Logs request configuration, response information, duration, and errors. Avoid logging credentials or sensitive payloads. |
| `withRetry(maxRetries = 3, baseDelay = 1000)` | Maximum retry count and base delay in milliseconds. | Retries thrown errors and responses with status codes of `500` or higher, using exponential backoff. Use with care for non-idempotent requests such as `POST`. |
| `withTimeout(timeoutDuration = 30000)` | Timeout duration in milliseconds. | Aborts a request when the timeout expires. A request-level `timeout` can override the default. |
| `withValidationStatus(validationCallback)` | Function receiving the HTTP status code and returning a boolean. | Treats a status as a response error when the callback returns `false`. |

Middleware functions can be imported from the package root:

```js
import {
    withConcurrency,
    withDeduplicate,
    withLatest,
    withLogger,
    withRetry,
    withTimeout,
    withValidationStatus,
} from '@straylightagency/http-client';
```

### Custom middleware

A middleware receives a `context` object and a `next` function. It can inspect or modify the request context before and after calling `next(context)`:

```js
const addRequestHeader = async (context, next) => {
    context.request.headers = {
        ...context.request.headers,
        'X-Client': 'my-app',
    };

    return next(context);
};

api.use(addRequestHeader);
```

## Contributing

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the affected animation behavior in a browser.
5. Submit a pull request.

Repository: https://github.com/straylightagency/js-http-client

Report issues: https://github.com/straylightagency/js-http-client/issues

## License

`@straylightagency/animate` is released under the MIT License.

See the [LICENSE](LICENSE) file for details.