/**
 * @param req
 * @param res
 * @param next
 */
exports.notFound = (req, res, next) => {
    const err = new Error('Not found');
    err.status = 404;
    next(err);
};

/**
 * Development error handler
 *
 * @param err
 * @param req
 * @param res
 * @param next
 */
exports.developmentErrors = (err, req, res, next) => {
    err.stack = err.stack || '';

    const errorDetails = {
        message: err.message,
        status: err.status,
        stack: err.stack
    };

    res.status(err.status || 500);
    res.format({
        'text/html': () => {
            res.render('error', errorDetails);
        }, 'application/json': () => res.json(errorDetails)
    });
};

/**
 * Production error handler
 *
 * @param err
 * @param req
 * @param res
 * @param next
 */
exports.productionErrors = (err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
};
