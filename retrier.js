export class Retrier {
    constructor(opts = {}) {
        this.opts = {};
        this.attempt = 0;
        this.opts.limit = opts.limit || 1;
        this.opts.delay = opts.delay || 0;
        this.opts.firstAttemptDelay = opts.firstAttemptDelay || 0;
        this.opts.reAuth = opts.reAuth || [401, 403];
        this.opts.quotaExceeded = opts.quotaExceeded;
    }
    resolve(fn) {
        this.fn = fn;
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            this.attempt = 0;
            this._doRetry();
        });
    }
    _doRetry(recentError) {
        if (this.attempt >= this.opts.limit) {
            return this._reject(recentError || new Error('Retry limit reached!'));
        }
        setTimeout(() => {
            const promise = this.fn(this.attempt);

            console.log('setto', promise, this.fn)
            if (!(promise instanceof Promise)) {
                // TODO: throw error in contructor if params aren't valid
                return this._reject(new Error('Expecting function which returns promise!'));
            }
            promise.then(response => {
                this._resolve(response);
            }, async error => {
                if (this.opts.reAuth.indexOf(error.status) > -1) {
                    await Goth.token()              // for authorization errors obtain an access token
                    this._doRetry(error);
                }
                else if (this.opts.quotaExceeded.indexOf(error.status) > -1) {
                    this.attempt++;
                    this._doRetry(error);
                }
            });
        }, this.attempt === 0 ? this.opts.firstAttemptDelay : this.opts.delay);
    }
}