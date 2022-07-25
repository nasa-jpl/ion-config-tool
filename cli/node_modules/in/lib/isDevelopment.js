'use strict';


module.exports = function $isDevelopment() {
    if (process.env.NODE_ENV && process.env.NODE_ENV.includes('dev')) {
        return true;
    }

    if (process.env.DEBUG) return true;


    return false;
};