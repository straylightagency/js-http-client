/**
 * @author anthony@straylightagency.be
 */
export default class ResponseHeaders extends Headers {
    /**
     * @param items {Object}
     */
    constructor(items = {}) {
        super( items );
    }
}