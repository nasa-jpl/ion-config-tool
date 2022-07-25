/*jshint esversion:6*/
'use strict';

const { sep, basename, dirname, extname, isAbsolute, resolve, join } = require('path');

function escapeRegExp(str = '') {
    //TODO: Test in Windows :{
    return str.replace(/\/\\/g, '\\$&');
}

function getIdFromPath(plugin, basePath) {
    let base = basename(plugin);
    const ext = extname(base);
    /**
     * If our plugin is on a subdirectory
     * then we normalize the plugin id to 
     * replace `/` with `.`.
     */
    if (dirname(plugin) !== basePath) {
        base = plugin.replace(basePath, '')
            .replace(new RegExp('^' + escapeRegExp(sep), 'g'), '')
            .replace(new RegExp(escapeRegExp(sep), 'g'), '.');
    }
    return base.replace(ext, '');
}

function normalizePath(plugin, basePath) {
    if (plugin.indexOf(sep) === -1) return plugin;
    if (isAbsolute(plugin)) return plugin;
    return resolve(join(basePath, plugin));
}

/**
 * This function will create the bean object for
 * each path.
 * 
 * @param {Array} plugins List of globed plugins
 * @param {String} basePath Base path for plugin location
 */
function normalizeArguments(plugins, basePath) {

    if (typeof plugins === 'string') plugins = [plugins];

    if (Array.isArray(plugins)) {
        /**
         * Where plugins is an array of this shape:
         * ```js
         * ['/Users/application/plugins/authentication',
         * '/Users/application/plugins/logger.js',
         * { '/Users/application/plugins/pubsub.js': { endpoint: 'URL', admin: 'admin', pass: 'pass' } },
         * 'debug']
         * ```
         */
        return plugins.map(plugin => {
            let out = {};

            if (typeof plugin === 'string') {
                out = {
                    id: getIdFromPath(plugin, basePath),
                    path: normalizePath(plugin, basePath),
                    config: {}
                };
            }

            /**
             * Were plugin is an object of this shape:
             * ```js
             * {'/Users/application/plugins/logger.js': { level: 'info' }}
             * ```
             */
            if (typeof plugin === 'object') {
                for (let id in plugin) {
                    out = {
                        id: getIdFromPath(id, basePath),
                        path: id,
                        config: plugin[id]
                    };
                }
            }
            return out;
        });
    }

    /**
     * Were plugins is an object of this shape:
     * ```
     * { 
     *  '/Users/application/plugins/authentication': { hash: 'sh1' },
     *  '/Users/application/plugins/logger.js': { level: 'info' },
     *  '/Users/application/plugins/pubsub.js': { endpoint: 'URL', admin: 'admin', pass: 'pass' },
     *  'debug': {}
     * }
     * ```
     */
    if (typeof plugins === 'object') {
        let out = [];
        let plugin, key;
        for (key in plugins) {
            plugin = {
                id: getIdFromPath(key, basePath),
                path: normalizePath(key, basePath),
                config: plugins[key]
            };
            out.push(plugin);
        }

        return out;
    }
}

module.exports = normalizeArguments;

module.exports.normalizePath = normalizePath;
module.exports.getIdFromPath = getIdFromPath;