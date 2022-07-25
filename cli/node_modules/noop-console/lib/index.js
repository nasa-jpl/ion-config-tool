'use strict';

const PROPS = 'memory'.split(',');

const METHODS = ('assert,clear,count,debug,dir,dirxml,error,group,' +
    'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
    'table,time,timeEnd,timeStamp,trace,warn').split(',');

let _stderr = console._stderr;
let _stdout = console._stdout;

/**
 * Shim console, make sure that if no console
 * available calls do not generate errors.
 * @return {Object} Console shim.
 */
const noopConsole = function(con = {}) {

    let empty = {},
        noop = function() {},
        properties = PROPS.concat(),
        methods = METHODS.concat(),
        prop,
        method;

    while (method = methods.pop()) {
        if (con[method]) {
            con['_' + method + '_'] = con[method];
        }
        con[method] = noop;
    }

    while (prop = properties.pop()) {
        if (con[prop]) {
            con['_' + prop + '_'] = con[prop];
        }
        con[prop] = empty;
    }

    const notConsole = typeof con.log !== 'function';

    con._restore = function() {
        if (notConsole) return;

        properties = PROPS.concat();
        methods = METHODS.concat();

        while (method = methods.pop()) {
            if (con['_' + method + '_']) {
                con[method] = con['_' + method + '_'];
                delete con['_' + method + '_'];
            }
        }

        while (prop = properties.pop()) {
            con[prop] = con['_' + prop + '_'];
            delete con['_' + prop + '_'];
        }
    };

    if (con._stderr) {
        con._stderr = _stderr;
        con._stdout = _stdout;
    }

    return con;
};

const logger = function(con = {}, strict = false) {
    if (console._is_wrapped) return;
    
    let methods = METHODS.concat(),
        method;

    while (method = methods.pop()) {
        if (console[method]) {
            con[method] = (function(m) {
                return function() {
                    console[m].apply(null, arguments);
                };
            })(method);
        } else {
            //e.g. node v6 does not have a debug method but v10 does.
            if (strict) throw new Error('Console does not have method' + method);
            else console.error('Console does not have metohd ' + method);
        }
    }

    con._is_wrapped = true;

    return con;
};

/**
 * Exports module
 */
module.exports = noopConsole;

/**
 * Exports empty logger;
 */
module.exports.logger = logger;
