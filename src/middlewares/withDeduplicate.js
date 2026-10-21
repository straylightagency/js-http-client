import HttpDuplicateError from "../errors/HttpDuplicateError.js";

/**
 * @return {function(*, *): Promise<*>}
 */
export default function withDeduplicate(signature = null) {
    const activeRequests = new Set();
    const getSignature = signature || ((config) => `${config.method.toUpperCase()}:${config.url}`);

    return async (context, next) => {
        const signature = getSignature(context.request);

        if (activeRequests.has(signature)) {
            throw new HttpDuplicateError(`Duplicate request blocked for: ${signature}`);
        }

        activeRequests.add(signature);

        try {
            return await next(context);
        } finally {
            activeRequests.delete(signature);
        }
    };
}