import HttpCancelledError from '../errors/HttpCancelledError.js';

/**
 * @param {number} maxRetries
 * @param {number} baseDelay
 * @param {boolean} retryOnWritingMethods
 * @return {(function(*, *): Promise<*|{response}>)|*}
 */
export default function withRetry(maxRetries = 3, baseDelay = 1000, retryOnWritingMethods = false) {
    return async (context, next) => {
        let attempt = 0;
        const isWritingMethod = ['POST', 'PUT', 'PATCH'].includes(context.request.method.toUpperCase());

        while (true) {
            try {
                context = await next(context);

                if (!context.response || context.response.status < 500) {
                    return context;
                }

                if (isWritingMethod && !retryOnWritingMethods) {
                    return context;
                }
            } catch (err) {
                if (err instanceof HttpCancelledError) {
                    throw err;
                }

                if (attempt >= maxRetries) {
                    throw err;
                }
            }

            if (attempt >= maxRetries) {
                break;
            }

            attempt++;

            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
            await new Promise(res => setTimeout(res, delay));
        }

        return context;
    };
}