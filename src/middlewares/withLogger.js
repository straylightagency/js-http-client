/**
 * @param {boolean} enabled
 * @return {(function(*, *): Promise<*|undefined>)|*|(function(*, *): *)}
 */
export default function withLogger(enabled = process.env.NODE_ENV !== 'production') {
    if (!enabled) return (context, next) => next(context);

    return async (context, next) => {
        const start = performance.now();
        const method = context.request.method || 'GET';
        const url = context.request.url;

        console.groupCollapsed(`%c[HTTP] ${method} ${url}`, 'color: #3498db; font-weight: bold;');
        console.log('Request Config:', context.request);

        try {
            context = await next(context);
            const duration = (performance.now() - start).toFixed(2);
            console.log(`Response [${context.response?.status}] (${duration}ms):`, context.response);
            console.groupEnd();

            return context;
        } catch (err) {
            const duration = (performance.now() - start).toFixed(2);
            console.error(`Failed after ${duration}ms:`, err);
            console.groupEnd();
            throw err;
        }
    };
}