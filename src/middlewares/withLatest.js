/**
 * @param {string|null} signature
 * @return {(function(*, *): Promise<*|undefined>)|*}
 */
export default function withLatest(signature = null) {
    const activeRequests = new Map();

    const getSignature = signature || ((config) => `${config.method.toUpperCase()}:${config.url}`);

    return async (context, next) => {
        const signature = getSignature(context.request);

        if (activeRequests.has(signature)) {
            const previousController = activeRequests.get(signature);
            previousController.abort();
        }

        const controller = new AbortController();

        const userSignal = context.request.signal;

        if (userSignal) {
            if (userSignal.aborted) {
                controller.abort(userSignal.reason);
            } else {
                userSignal.addEventListener('abort', () => controller.abort(userSignal.reason), { once: true });
            }
        }

        context.request.signal = controller.signal;
        activeRequests.set(signature, controller);

        try {
            return await next(context);
        } finally {
            if (activeRequests.get(signature) === controller) {
                activeRequests.delete(signature);
            }
        }
    };
}