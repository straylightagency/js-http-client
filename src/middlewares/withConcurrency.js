/**
 * @param {number} limit
 * @return {(function(*, *): Promise<void>)|*}
 */
export default function withConcurrency(limit= 5 ) {
    const maxConcurrent = limit ?? 5;
    let activeCount = 0;
    const queue = [];

    const acquire = () => {
        if (activeCount < maxConcurrent) {
            activeCount++;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            queue.push(resolve);
        });
    };

    const release = () => {
        activeCount--;
        if (queue.length > 0) {
            activeCount++;
            const nextResolve = queue.shift();
            if (nextResolve) nextResolve();
        }
    };

    return async (context, next) => {
        await acquire();

        try {
            return await next(context);
        } finally {
            release();
        }
    };
}