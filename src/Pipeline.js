/**
 * @author anthony@straylightagency.be
 */
export default class Pipeline {
    /**
     * @type {*}
     */
    #passable;

    /**
     * @type {function}
     */
    #catchCallback;

    /**
     * @type {[]}
     */
    #pipes = [];

    /**
     *
     */
    constructor() {
        this.catch( error => {
            throw error
        } );
    }

    /**
     * @param passable {*}
     * @returns {Pipeline}
     */
    send(passable) {
        this.#passable = passable;

        return this;
    }

    /**
     * @param pipes {[]}
     * @returns {Pipeline}
     */
    through(pipes) {
        this.#pipes = pipes;

        return this;
    }

    /**
     * @param pipe {function}
     * @returns {Pipeline}
     */
    pipe(pipe) {
        this.#pipes.push( pipe );

        return this;
    }

    /**
     * @param callbackFn {function}
     * @returns {Pipeline}
     */
    catch(callbackFn) {
        this.#catchCallback = callbackFn;

        return this;
    }

    /**
     * @param destination {function}
     * @returns {Promise<*>}
     */
    async then(destination) {
        try {
            const pipeline = this.#pipes.reverse().reduce( this.carry(), this.prepare( destination ) );

            return await pipeline( this.#passable );
        } catch (e) {
            const callback = this.#catchCallback;

            return callback( e );
        }
    }

    /**
     * @returns {Promise<*|undefined>}
     */
    thenReturn() {
        return this.then( passable => passable );
    }

    /**
     * @param destination {function}
     * @returns {function(*): Promise<*>}
     */
    prepare(destination) {
        return async passable => await destination( passable );
    }

    /**
     * @returns {function(*, *): function(*): Promise<*>}
     */
    carry() {
        return (stack, pipe) => async passable => await pipe( passable, stack )
    }
}