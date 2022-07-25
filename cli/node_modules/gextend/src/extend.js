/*
 * gextend
 * https://github.com/goliatone/gextend
 * Created with gbase.
 * Copyright (c) 2014 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function(root, name, deps, factory) {
    "use strict";
    // Node
    if (typeof deps === 'function') {
        factory = deps;
        deps = [];
    }

    if (typeof exports === 'object') {
        module.exports = factory.apply(root, deps.map(require));
    } else if (typeof define === 'function' && 'amd' in define) {
        //require js, here we assume the file is named as the lower
        //case module name.
        define(name.toLowerCase(), deps, factory);
    } else {
        // Browser
        var d, i = 0,
            global = root,
            old = global[name],
            mod;
        while ((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function() {
            global[name] = old;
            return mod;
        };
    }
}(this, "extend", function() {
    /**
     * Extend method.
     * @param  {Object} target Source object
     * @return {Object}        Resulting object from
     *                         extending target to params.
     */
    var _extend = function extend(target) {
        var sources = [].slice.call(arguments, 1);

        var skip = _buildCheck(_extend._attr);

        sources.forEach(function(source) {
            if (!source) return;
            for (var property in source) {

                if (skip(property)) continue;

                if (source[property] && source[property].constructor &&
                    source[property].constructor === Object) {
                    target[property] = target[property] || {};
                    if (typeof target[property] === 'function') target[property] = source[property]; //<<< ADD
                    else target[property] = extend(target[property], source[property]);
                } else target[property] = source[property];
            }
        });

        _extend._attr = null;

        return target;
    };

    function _buildCheck(attributes) {

        if (typeof attributes === 'function') return attributes;

        if (Array.isArray(attributes)) {
            return function(attribute) {
                return attributes.indexOf(attribute) === -1;
            }
        }

        if (typeof attributes === 'boolean') return function(attribute) {
            return !attributes;
        }

        if (!attributes) return function(attribute) {
            return false;
        }
    }

    _extend.buildCheck = _buildCheck;

    /**
     * Only extend our object with the 
     * attributes present in the `attributes`
     * array.
     * @param {Array} attributes List of attributes
     * @return {Object} Returns the `extend` object
     */
    _extend.only = function(attributes) {
        _extend._attr = attributes;
        return _extend;
    };

    /**
     * Wraps an object in a function
     * so that we don't polute a stand 
     * in object, e.g. if we want to have
     * a temporaray `logger` using the 
     * built in console we wrap the `console`
     * object in a shim. 
     * 
     * After extending our object we call
     * `unshim` to replace these functions
     * by they wrapped object.
     */
    _extend.shim = function(obj) {
        var shim = function() {
            return obj;
        };
        shim.__shim = true;
        return shim;
    };

    _extend.unshim = function(obj) {
        for (var property in obj) {
            if (obj[property].__shim) {
                obj[property] = obj[property]();
            }
        }
        return _extend;
    };


    _extend.VERSION = '0.6.1';

    return _extend;
}));