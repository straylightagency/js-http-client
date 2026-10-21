/**
 * @param {number} timeoutDuration
 * @return {(function(*, *): Promise<*|undefined>)|*}
 */
export default function withTimeout(timeoutDuration = 30_000) {
    return async (context, next) => {
        const timeout = context.request.timeout ?? timeoutDuration;

        if (!timeout) {
            return next(context);
        }

        const controller = new AbortController();

        if (context.request.signal) {
            context.request.signal.addEventListener('abort', () => controller.abort());
        }

        const timer = setTimeout(() => controller.abort(new HttpCancelledError('Request timeout')), timeout);
        context.request.signal = controller.signal;

        try {
            return await next(context);
        } catch (err) {
            if (controller.signal.aborted && !context.request.signal?.aborted) {
                throw new HttpCancelledError(`Request timeout after ${timeout}ms`);
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    };
}