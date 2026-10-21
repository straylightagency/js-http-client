import HttpResponseError from "../errors/HttpResponseError.js";

/**
 * @param {function} validationCallback
 * @return {(function(*, *): Promise<void>)|*}
 */
export default function withValidationStatus(validationCallback) {
    return async (context, next) => {
        context = await next(context);

        if ( ! validationCallback(context.response.status) ) {
            throw new HttpResponseError(context.response);
        }

        return context;
    };
}